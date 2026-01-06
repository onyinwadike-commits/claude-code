/**
 * Express middleware for Prometheus metrics collection
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  httpRequestDuration,
  httpRequestsTotal,
  errorsTotal,
  createTimer,
} from './index';

/**
 * Normalize route path for metrics labels
 * Replaces dynamic segments with placeholders
 */
function normalizeRoutePath(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[0-9a-f]{24}/gi, '/:id') // MongoDB ObjectIds
    .replace(/\?.*/g, ''); // Remove query strings
}

/**
 * Get status code category
 */
function getStatusCategory(statusCode: number): string {
  if (statusCode < 200) return '1xx';
  if (statusCode < 300) return '2xx';
  if (statusCode < 400) return '3xx';
  if (statusCode < 500) return '4xx';
  return '5xx';
}

/**
 * Metrics middleware for Express
 * Tracks request duration and counts
 */
export function metricsMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip metrics endpoint itself
    if (req.path === '/metrics' || req.path === '/health') {
      next();
      return;
    }

    const route = normalizeRoutePath(req.route?.path || req.path);
    const method = req.method;

    // Start timer
    const endTimer = createTimer(httpRequestDuration, {
      method,
      route,
      status_code: '', // Will be set on finish
    });

    // Track response
    const originalEnd = res.end;
    res.end = function (this: Response, ...args: Parameters<Response['end']>): Response {
      const statusCode = res.statusCode.toString();

      // Record request count
      httpRequestsTotal.inc({
        method,
        route,
        status_code: statusCode,
      });

      // Record duration with final status code
      const duration = process.hrtime.bigint();
      httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        0 // Will be overwritten by endTimer
      );

      // Record errors
      if (res.statusCode >= 400) {
        const severity = res.statusCode >= 500 ? 'error' : 'warning';
        errorsTotal.inc({
          service: process.env.SERVICE_NAME || 'unknown',
          error_type: `http_${getStatusCategory(res.statusCode)}`,
          severity,
        });
      }

      return originalEnd.apply(this, args);
    } as typeof res.end;

    next();
  };
}

/**
 * Error tracking middleware
 * Should be added after routes
 */
export function errorMetricsMiddleware(): (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    errorsTotal.inc({
      service: process.env.SERVICE_NAME || 'unknown',
      error_type: err.name || 'UnknownError',
      severity: 'error',
    });

    next(err);
  };
}

export default metricsMiddleware;
