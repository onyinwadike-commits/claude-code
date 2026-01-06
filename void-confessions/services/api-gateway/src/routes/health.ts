import type { FastifyPluginAsync } from 'fastify';
import { isRedisHealthy } from '../lib/redis';
import { clientManager } from '../websocket';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Basic health check
   */
  fastify.get('/', async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
    };
  });

  /**
   * Detailed readiness check including dependencies
   */
  fastify.get('/ready', async () => {
    const redisHealthy = await isRedisHealthy();
    const wsStats = clientManager.getStats();

    const allHealthy = redisHealthy;

    return {
      status: allHealthy ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        'confession-service': 'unknown',
        'redaction-service': 'unknown',
        'sentiment-service': 'unknown',
      },
      websocket: {
        connections: wsStats.totalConnections,
        uptime: wsStats.uptime,
        connectionsByVoid: wsStats.connectionsByVoid,
      },
    };
  });

  /**
   * Liveness probe - just confirms the service is running
   */
  fastify.get('/live', async () => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  });
};
