import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { confessionRoutes } from './routes/confessions';
import { moderationRoutes } from './routes/moderation';
import { healthRoutes } from './routes/health';
import { streamRoutes } from './routes/stream';
import {
  connectRedis,
  disconnectRedis,
  isRedisHealthy,
} from './lib/redis';
import { setupRedisSubscriptions, clientManager } from './websocket';

const fastify = Fastify({
  logger: true,
});

async function buildApp() {
  // Security plugins
  await fastify.register(helmet, {
    // Disable contentSecurityPolicy for WebSocket support
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Skip rate limiting for WebSocket upgrade requests
    skipOnError: true,
    keyGenerator: (request) => {
      return request.ip;
    },
  });

  // WebSocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB max message size
      clientTracking: false, // We manage clients ourselves
    },
  });

  // REST Routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(confessionRoutes, { prefix: '/api/v1/confessions' });
  await fastify.register(moderationRoutes, { prefix: '/api/v1/moderation' });

  // WebSocket Routes
  await fastify.register(streamRoutes, { prefix: '/api/v1/stream' });

  return fastify;
}

async function start() {
  try {
    // Connect to Redis
    try {
      await connectRedis();
      await setupRedisSubscriptions();
    } catch (error) {
      console.warn('Redis connection failed, running without pub/sub:', error);
      // Continue without Redis - will work in single-server mode
    }

    const app = await buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    // Cleanup stale connections periodically
    const cleanupInterval = setInterval(() => {
      const cleaned = clientManager.cleanupStaleConnections();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} stale WebSocket connections`);
      }
    }, 60000); // Every minute

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      clearInterval(cleanupInterval);

      // Close all WebSocket connections
      const stats = clientManager.getStats();
      console.log(`Closing ${stats.totalConnections} WebSocket connections...`);

      await app.close();
      await disconnectRedis();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    await app.listen({ port, host });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  Void Confessions API Gateway             ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP:      http://${host}:${port}
║  WebSocket: ws://${host}:${port}/api/v1/stream/ws
║  Health:    http://${host}:${port}/health
╠═══════════════════════════════════════════════════════════╣
║  Redis:     ${await isRedisHealthy() ? 'Connected ✓' : 'Disconnected ✗'}
╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
