import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  });

  fastify.get('/ready', async () => {
    // Add downstream service checks here
    return {
      status: 'ready',
      services: {
        'confession-service': 'unknown',
        'redaction-service': 'unknown',
        'sentiment-service': 'unknown',
      },
    };
  });
};
