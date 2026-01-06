import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { confessionRoutes } from './routes/confessions';
import { moderationRoutes } from './routes/moderation';
import { healthRoutes } from './routes/health';

const fastify = Fastify({
  logger: true,
});

async function buildApp() {
  // Security plugins
  await fastify.register(helmet);
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes
  await fastify.register(healthRoutes, { prefix: '/health' });
  await fastify.register(confessionRoutes, { prefix: '/api/v1/confessions' });
  await fastify.register(moderationRoutes, { prefix: '/api/v1/moderation' });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`API Gateway running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
