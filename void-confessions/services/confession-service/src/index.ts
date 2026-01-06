import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { v4 as uuid } from 'uuid';
import type {
  VoidType,
  ReleaseStyle,
  EchoWord,
  Confession,
  CreateConfessionInput,
} from '@void-confessions/core';
import {
  CONFESSION_MAX_LENGTH,
  validateConfessionContent,
} from '@void-confessions/core';
import {
  connectRedis,
  disconnectRedis,
  isRedisHealthy,
  storeConfession,
  getConfession,
  updateConfession,
  addToModerationQueue,
  incrementResonance,
  getResonanceCount,
  addEcho,
  getEchoes,
  publishMessage,
  CHANNELS,
} from './lib/redis';
import { detectCrisis, shouldFlagForReview } from './lib/crisis-detection';
import { redactionClient } from './clients/redaction-client';

const fastify = Fastify({
  logger: true,
});

// Valid enums
const VALID_VOID_TYPES: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];
const VALID_RELEASE_STYLES: ReleaseStyle[] = [
  'default', 'burn', 'shatter', 'scream', 'dissolve', 'storm', 'drift'
];
const VALID_ECHO_WORDS: EchoWord[] = [
  'same', 'felt', 'brave', 'heard', 'seen', 'lighter', 'strength'
];

// TTL constants
const CONFESSION_TTL_SECONDS = 5 * 60; // 5 minutes
const PUBLISH_DELAY_MS = 2000; // 2 seconds

interface CreateConfessionBody extends CreateConfessionInput {
  sessionHash?: string;
}

interface EchoBody {
  word: EchoWord;
  sessionHash?: string;
}

async function buildApp() {
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  /**
   * Health check endpoint
   */
  fastify.get('/health', async () => {
    const redisHealthy = await isRedisHealthy();
    const redactionHealthy = await redactionClient.isHealthy();

    return {
      status: redisHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'confession-service',
      dependencies: {
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        'redaction-service': redactionHealthy ? 'healthy' : 'unhealthy',
      },
    };
  });

  /**
   * POST /confessions
   * Create a new confession
   */
  fastify.post<{ Body: CreateConfessionBody }>('/confessions', async (request, reply) => {
    const { content, voidType, releaseStyle = 'default', tags = [], sessionHash } = request.body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Content is required' },
      });
    }

    if (content.length > CONFESSION_MAX_LENGTH) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Content must not exceed ${CONFESSION_MAX_LENGTH} characters`,
        },
      });
    }

    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: validation.error },
      });
    }

    // Validate voidType
    if (!voidType || !VALID_VOID_TYPES.includes(voidType)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `voidType must be one of: ${VALID_VOID_TYPES.join(', ')}`,
        },
      });
    }

    // Validate releaseStyle
    if (!VALID_RELEASE_STYLES.includes(releaseStyle)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `releaseStyle must be one of: ${VALID_RELEASE_STYLES.join(', ')}`,
        },
      });
    }

    // Check for crisis indicators
    const crisisResult = detectCrisis(content);
    if (crisisResult.isCrisis) {
      // Return crisis resources but still allow the confession
      // This is important - we don't want to reject someone in crisis
      fastify.log.warn({ confessionContent: content.substring(0, 50) }, 'Crisis indicators detected');

      return reply.status(200).send({
        success: true,
        crisis: true,
        message: crisisResult.message,
        resources: crisisResult.resources,
        data: null, // Don't return confession data when crisis detected
      });
    }

    // Call redaction service to scrub PII
    let redactedContent = content;
    let redactionInfo = { redactions_made: 0, redaction_types: [] as string[] };

    try {
      const redactionResult = await redactionClient.redact(content);
      redactedContent = redactionResult.redacted_content;
      redactionInfo = {
        redactions_made: redactionResult.redactions_made,
        redaction_types: redactionResult.redaction_types,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Redaction service failed, using original content');
      // Continue with original content if redaction fails
    }

    // Create confession object
    const now = new Date();
    const confession: Confession = {
      id: uuid(),
      content: redactedContent,
      redactedContent: redactionInfo.redactions_made > 0 ? redactedContent : undefined,
      voidType,
      releaseStyle,
      createdAt: now,
      expiresAt: new Date(now.getTime() + CONFESSION_TTL_SECONDS * 1000),
      updatedAt: now,
      resonanceCount: 0,
      echoes: [],
      status: 'pending',
      viewCount: 0,
      reportCount: 0,
      tags,
      isReleased: false,
      sessionHash,
    };

    // Store in Redis with TTL
    await storeConfession(confession, CONFESSION_TTL_SECONDS);

    // Add to moderation queue
    await addToModerationQueue(confession.id);

    // Publish to moderation channel
    await publishMessage(CHANNELS.moderationQueue, 'confession:pending', {
      confessionId: confession.id,
      voidType,
      contentPreview: redactedContent.substring(0, 100),
    });

    fastify.log.info({ confessionId: confession.id, voidType }, 'Confession created and queued');

    // After 2-second delay, publish to void channel if not flagged
    setTimeout(async () => {
      try {
        const currentConfession = await getConfession(confession.id);
        if (currentConfession && currentConfession.status !== 'rejected') {
          // Mark as released
          currentConfession.isReleased = true;
          currentConfession.status = 'approved';
          currentConfession.approvedAt = new Date();
          await updateConfession(currentConfession);

          // Publish to void channel
          await publishMessage(CHANNELS.voidStream(voidType), 'confession:new', {
            confession: {
              id: currentConfession.id,
              content: currentConfession.content,
              voidType: currentConfession.voidType,
              releaseStyle: currentConfession.releaseStyle,
              createdAt: currentConfession.createdAt,
              expiresAt: currentConfession.expiresAt,
              resonanceCount: currentConfession.resonanceCount,
              echoes: currentConfession.echoes,
            },
          });

          fastify.log.info({ confessionId: confession.id }, 'Confession released to void');
        }
      } catch (error) {
        fastify.log.error({ error, confessionId: confession.id }, 'Failed to release confession');
      }
    }, PUBLISH_DELAY_MS);

    // Return response (without sensitive fields)
    const responseConfession = {
      id: confession.id,
      content: confession.content,
      voidType: confession.voidType,
      releaseStyle: confession.releaseStyle,
      createdAt: confession.createdAt,
      expiresAt: confession.expiresAt,
      resonanceCount: confession.resonanceCount,
      echoes: confession.echoes,
      status: confession.status,
      isReleased: confession.isReleased,
    };

    return reply.status(201).send({
      success: true,
      data: responseConfession,
      meta: {
        redactions: redactionInfo.redactions_made,
        expiresInSeconds: CONFESSION_TTL_SECONDS,
      },
    });
  });

  /**
   * POST /confessions/:id/resonate
   * Increment resonance counter for a confession
   */
  fastify.post<{ Params: { id: string } }>('/confessions/:id/resonate', async (request, reply) => {
    const { id } = request.params;

    // Get confession to verify it exists
    const confession = await getConfession(id);
    if (!confession) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Confession not found or expired' },
      });
    }

    // Check if confession is released
    if (!confession.isReleased) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NOT_RELEASED', message: 'Confession has not been released yet' },
      });
    }

    // Increment resonance counter
    const newCount = await incrementResonance(id);

    // Update confession object
    confession.resonanceCount = newCount;
    confession.updatedAt = new Date();
    await updateConfession(confession);

    // Publish resonance event
    await publishMessage(CHANNELS.voidStream(confession.voidType), 'confession:resonance', {
      confessionId: id,
      newCount,
    });

    await publishMessage(CHANNELS.confessionUpdate(id), 'confession:resonance', {
      confessionId: id,
      newCount,
    });

    fastify.log.info({ confessionId: id, newCount }, 'Resonance added');

    return reply.send({
      success: true,
      data: {
        confessionId: id,
        resonanceCount: newCount,
      },
    });
  });

  /**
   * POST /confessions/:id/echo
   * Add an echo word to a confession
   */
  fastify.post<{ Params: { id: string }; Body: EchoBody }>(
    '/confessions/:id/echo',
    async (request, reply) => {
      const { id } = request.params;
      const { word, sessionHash } = request.body;

      // Validate echo word
      if (!word || !VALID_ECHO_WORDS.includes(word)) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `word must be one of: ${VALID_ECHO_WORDS.join(', ')}`,
          },
        });
      }

      // Get confession to verify it exists
      const confession = await getConfession(id);
      if (!confession) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Confession not found or expired' },
        });
      }

      // Check if confession is released
      if (!confession.isReleased) {
        return reply.status(400).send({
          success: false,
          error: { code: 'NOT_RELEASED', message: 'Confession has not been released yet' },
        });
      }

      // Add echo
      const result = await addEcho(id, word, sessionHash);

      if (!result.success && result.alreadyEchoed) {
        return reply.status(400).send({
          success: false,
          error: { code: 'ALREADY_ECHOED', message: 'You have already echoed this word' },
        });
      }

      // Update confession echoes
      const allEchoes = await getEchoes(id);
      confession.echoes = Object.entries(allEchoes).map(([w, count]) => ({
        word: w as EchoWord,
        count,
      }));
      confession.updatedAt = new Date();
      await updateConfession(confession);

      // Publish echo event
      await publishMessage(CHANNELS.voidStream(confession.voidType), 'confession:echo', {
        confessionId: id,
        word,
        newCount: result.newCount,
      });

      await publishMessage(CHANNELS.confessionUpdate(id), 'confession:echo', {
        confessionId: id,
        word,
        newCount: result.newCount,
      });

      fastify.log.info({ confessionId: id, word, newCount: result.newCount }, 'Echo added');

      return reply.send({
        success: true,
        data: {
          confessionId: id,
          word,
          count: result.newCount,
          allEchoes: confession.echoes,
        },
      });
    }
  );

  /**
   * GET /confessions/:id
   * Get a specific confession
   */
  fastify.get<{ Params: { id: string } }>('/confessions/:id', async (request, reply) => {
    const { id } = request.params;

    const confession = await getConfession(id);
    if (!confession) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Confession not found or expired' },
      });
    }

    // Increment view count
    confession.viewCount += 1;
    await updateConfession(confession);

    // Return without sensitive fields
    const responseConfession = {
      id: confession.id,
      content: confession.content,
      voidType: confession.voidType,
      releaseStyle: confession.releaseStyle,
      createdAt: confession.createdAt,
      expiresAt: confession.expiresAt,
      resonanceCount: confession.resonanceCount,
      echoes: confession.echoes,
      status: confession.status,
      isReleased: confession.isReleased,
      viewCount: confession.viewCount,
    };

    return reply.send({
      success: true,
      data: responseConfession,
    });
  });

  return fastify;
}

async function start() {
  try {
    // Connect to Redis
    try {
      await connectRedis();
    } catch (error) {
      console.warn('Redis connection failed:', error);
      // Exit if Redis is unavailable - it's required for this service
      process.exit(1);
    }

    const app = await buildApp();
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await disconnectRedis();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    await app.listen({ port, host });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                 Void Confessions Service                  ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP:    http://${host}:${port}
║  Health:  http://${host}:${port}/health
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    POST /confessions         - Create confession          ║
║    POST /confessions/:id/resonate - Add resonance         ║
║    POST /confessions/:id/echo     - Add echo              ║
║    GET  /confessions/:id          - Get confession        ║
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
