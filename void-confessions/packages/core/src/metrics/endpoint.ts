/**
 * Metrics endpoint handler for exposing Prometheus metrics
 */

import { Request, Response, Router } from 'express';
import { getMetrics, getMetricsContentType, serviceHealthGauge } from './index';

/**
 * Health check response
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
  }[];
}

/**
 * Create metrics and health router
 */
export function createMetricsRouter(options: {
  serviceName: string;
  version: string;
  healthChecks?: Array<{
    name: string;
    check: () => Promise<boolean>;
  }>;
}): Router {
  const router = Router();
  const startTime = Date.now();

  /**
   * Prometheus metrics endpoint
   */
  router.get('/metrics', async (_req: Request, res: Response) => {
    try {
      const metrics = await getMetrics();
      res.set('Content-Type', getMetricsContentType());
      res.send(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to collect metrics' });
    }
  });

  /**
   * Health check endpoint
   */
  router.get('/health', async (_req: Request, res: Response) => {
    const checks: HealthCheckResponse['checks'] = [];
    let overallStatus: HealthCheckResponse['status'] = 'healthy';

    // Run health checks
    if (options.healthChecks) {
      for (const healthCheck of options.healthChecks) {
        try {
          const result = await healthCheck.check();
          checks.push({
            name: healthCheck.name,
            status: result ? 'pass' : 'fail',
          });
          if (!result) {
            overallStatus = 'unhealthy';
          }
        } catch (error) {
          checks.push({
            name: healthCheck.name,
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          overallStatus = 'unhealthy';
        }
      }
    }

    // Update service health metric
    serviceHealthGauge.set(
      { service: options.serviceName, instance: process.env.HOSTNAME || 'unknown' },
      overallStatus === 'healthy' ? 1 : 0
    );

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: options.serviceName,
      version: options.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(response);
  });

  /**
   * Liveness probe (Kubernetes)
   */
  router.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
  });

  /**
   * Readiness probe (Kubernetes)
   */
  router.get('/health/ready', async (_req: Request, res: Response) => {
    // Check if service is ready to accept traffic
    let isReady = true;

    if (options.healthChecks) {
      for (const healthCheck of options.healthChecks) {
        try {
          const result = await healthCheck.check();
          if (!result) {
            isReady = false;
            break;
          }
        } catch {
          isReady = false;
          break;
        }
      }
    }

    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  });

  return router;
}

export default createMetricsRouter;
