/**
 * Prometheus Metrics for Void Confessions
 *
 * Exports metrics for:
 * - Confessions per minute per void
 * - Resonances per minute
 * - WebSocket connection count
 * - Moderation queue depth
 * - Crisis interventions triggered
 */

import { Registry, Counter, Gauge, Histogram, Summary } from 'prom-client';

// Create a custom registry for our metrics
export const metricsRegistry = new Registry();

// Default labels applied to all metrics
metricsRegistry.setDefaultLabels({
  app: 'void-confessions',
});

// ============================================
// CONFESSION METRICS
// ============================================

/**
 * Total confessions submitted
 * Labels: void_id, status (submitted, blocked, flagged)
 */
export const confessionsTotal = new Counter({
  name: 'void_confessions_total',
  help: 'Total number of confessions submitted',
  labelNames: ['void_id', 'status'],
  registers: [metricsRegistry],
});

/**
 * Confessions per minute rate (calculated via Prometheus queries)
 * This counter is used to derive the rate
 */
export const confessionsCounter = new Counter({
  name: 'void_confessions_count',
  help: 'Counter for calculating confessions per minute',
  labelNames: ['void_id'],
  registers: [metricsRegistry],
});

/**
 * Confession processing duration
 */
export const confessionProcessingDuration = new Histogram({
  name: 'void_confession_processing_duration_seconds',
  help: 'Time taken to process a confession through the pipeline',
  labelNames: ['void_id', 'stage'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

/**
 * Active confessions in stream (gauge)
 */
export const activeConfessionsGauge = new Gauge({
  name: 'void_active_confessions',
  help: 'Number of active confessions currently in the stream',
  labelNames: ['void_id'],
  registers: [metricsRegistry],
});

// ============================================
// RESONANCE METRICS
// ============================================

/**
 * Total resonances (reactions) given
 * Labels: void_id, resonance_type
 */
export const resonancesTotal = new Counter({
  name: 'void_resonances_total',
  help: 'Total number of resonances given to confessions',
  labelNames: ['void_id', 'resonance_type'],
  registers: [metricsRegistry],
});

/**
 * Resonances counter for rate calculation
 */
export const resonancesCounter = new Counter({
  name: 'void_resonances_count',
  help: 'Counter for calculating resonances per minute',
  labelNames: ['void_id'],
  registers: [metricsRegistry],
});

/**
 * Average resonances per confession (summary)
 */
export const resonancesPerConfession = new Summary({
  name: 'void_resonances_per_confession',
  help: 'Distribution of resonances per confession',
  labelNames: ['void_id'],
  percentiles: [0.5, 0.9, 0.99],
  registers: [metricsRegistry],
});

// ============================================
// WEBSOCKET METRICS
// ============================================

/**
 * Current WebSocket connections
 */
export const websocketConnectionsGauge = new Gauge({
  name: 'void_websocket_connections',
  help: 'Current number of active WebSocket connections',
  labelNames: ['void_id', 'connection_type'],
  registers: [metricsRegistry],
});

/**
 * Total WebSocket connections made (for connection rate)
 */
export const websocketConnectionsTotal = new Counter({
  name: 'void_websocket_connections_total',
  help: 'Total WebSocket connections made',
  labelNames: ['void_id', 'connection_type'],
  registers: [metricsRegistry],
});

/**
 * WebSocket message throughput
 */
export const websocketMessagesTotal = new Counter({
  name: 'void_websocket_messages_total',
  help: 'Total WebSocket messages sent/received',
  labelNames: ['void_id', 'direction', 'message_type'],
  registers: [metricsRegistry],
});

/**
 * WebSocket connection duration
 */
export const websocketConnectionDuration = new Histogram({
  name: 'void_websocket_connection_duration_seconds',
  help: 'Duration of WebSocket connections',
  labelNames: ['void_id'],
  buckets: [1, 5, 15, 30, 60, 120, 300, 600, 1800, 3600],
  registers: [metricsRegistry],
});

// ============================================
// MODERATION METRICS
// ============================================

/**
 * Current moderation queue depth
 */
export const moderationQueueDepth = new Gauge({
  name: 'void_moderation_queue_depth',
  help: 'Current number of items in the moderation queue',
  labelNames: ['priority', 'flag_reason'],
  registers: [metricsRegistry],
});

/**
 * Total items processed by moderation
 */
export const moderationProcessedTotal = new Counter({
  name: 'void_moderation_processed_total',
  help: 'Total items processed by moderation',
  labelNames: ['decision', 'flag_reason'],
  registers: [metricsRegistry],
});

/**
 * Auto-moderation decisions
 */
export const autoModerationTotal = new Counter({
  name: 'void_auto_moderation_total',
  help: 'Total automated moderation decisions',
  labelNames: ['decision', 'classifier'],
  registers: [metricsRegistry],
});

/**
 * Moderation processing time
 */
export const moderationDuration = new Histogram({
  name: 'void_moderation_duration_seconds',
  help: 'Time taken for human moderation review',
  labelNames: ['decision'],
  buckets: [10, 30, 60, 120, 300, 600, 1800],
  registers: [metricsRegistry],
});

/**
 * Moderator shift time
 */
export const moderatorShiftDuration = new Gauge({
  name: 'void_moderator_shift_duration_seconds',
  help: 'Current shift duration for moderators',
  labelNames: ['moderator_id'],
  registers: [metricsRegistry],
});

// ============================================
// CRISIS INTERVENTION METRICS
// ============================================

/**
 * Crisis interventions triggered
 * Labels: locale, category (suicide, self_harm, etc.)
 */
export const crisisInterventionsTotal = new Counter({
  name: 'void_crisis_interventions_total',
  help: 'Total number of crisis interventions triggered',
  labelNames: ['locale', 'category', 'severity'],
  registers: [metricsRegistry],
});

/**
 * Crisis resources viewed
 */
export const crisisResourcesViewed = new Counter({
  name: 'void_crisis_resources_viewed_total',
  help: 'Total times crisis resources were viewed',
  labelNames: ['locale', 'resource_type'],
  registers: [metricsRegistry],
});

/**
 * Crisis hotline clicks/calls
 */
export const crisisHotlineClicks = new Counter({
  name: 'void_crisis_hotline_clicks_total',
  help: 'Total clicks on crisis hotline links',
  labelNames: ['locale', 'hotline_name'],
  registers: [metricsRegistry],
});

// ============================================
// SYSTEM HEALTH METRICS
// ============================================

/**
 * HTTP request duration
 */
export const httpRequestDuration = new Histogram({
  name: 'void_http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

/**
 * HTTP requests total
 */
export const httpRequestsTotal = new Counter({
  name: 'void_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

/**
 * Error counter
 */
export const errorsTotal = new Counter({
  name: 'void_errors_total',
  help: 'Total errors by type and service',
  labelNames: ['service', 'error_type', 'severity'],
  registers: [metricsRegistry],
});

/**
 * Service health status
 */
export const serviceHealthGauge = new Gauge({
  name: 'void_service_health',
  help: 'Service health status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service', 'instance'],
  registers: [metricsRegistry],
});

/**
 * Database connection pool
 */
export const dbConnectionPoolGauge = new Gauge({
  name: 'void_db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['pool', 'status'],
  registers: [metricsRegistry],
});

/**
 * Redis connection status
 */
export const redisConnectionGauge = new Gauge({
  name: 'void_redis_connection',
  help: 'Redis connection status',
  labelNames: ['instance', 'status'],
  registers: [metricsRegistry],
});

// ============================================
// VOID-SPECIFIC METRICS (for "Void Weather")
// ============================================

/**
 * Void activity level (composite metric)
 */
export const voidActivityGauge = new Gauge({
  name: 'void_activity_level',
  help: 'Current activity level of each void (0-100)',
  labelNames: ['void_id', 'void_name'],
  registers: [metricsRegistry],
});

/**
 * Void sentiment score
 */
export const voidSentimentGauge = new Gauge({
  name: 'void_sentiment_score',
  help: 'Average sentiment score in each void (-1 to 1)',
  labelNames: ['void_id', 'void_name'],
  registers: [metricsRegistry],
});

/**
 * Void "temperature" (engagement level)
 */
export const voidTemperatureGauge = new Gauge({
  name: 'void_temperature',
  help: 'Engagement temperature of each void',
  labelNames: ['void_id', 'void_name'],
  registers: [metricsRegistry],
});

/**
 * Unique visitors per void
 */
export const voidUniqueVisitorsGauge = new Gauge({
  name: 'void_unique_visitors',
  help: 'Unique anonymous visitors per void in rolling window',
  labelNames: ['void_id'],
  registers: [metricsRegistry],
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Record a confession submission
 */
export function recordConfession(voidId: string, status: 'submitted' | 'blocked' | 'flagged'): void {
  confessionsTotal.inc({ void_id: voidId, status });
  confessionsCounter.inc({ void_id: voidId });
}

/**
 * Record a resonance
 */
export function recordResonance(voidId: string, resonanceType: string): void {
  resonancesTotal.inc({ void_id: voidId, resonance_type: resonanceType });
  resonancesCounter.inc({ void_id: voidId });
}

/**
 * Update WebSocket connection count
 */
export function updateWebSocketConnections(voidId: string, connectionType: string, delta: number): void {
  if (delta > 0) {
    websocketConnectionsGauge.inc({ void_id: voidId, connection_type: connectionType }, delta);
    websocketConnectionsTotal.inc({ void_id: voidId, connection_type: connectionType }, delta);
  } else {
    websocketConnectionsGauge.dec({ void_id: voidId, connection_type: connectionType }, Math.abs(delta));
  }
}

/**
 * Update moderation queue depth
 */
export function updateModerationQueue(priority: string, flagReason: string, depth: number): void {
  moderationQueueDepth.set({ priority, flag_reason: flagReason }, depth);
}

/**
 * Record crisis intervention
 */
export function recordCrisisIntervention(
  locale: string,
  category: string,
  severity: 'low' | 'medium' | 'high' | 'critical'
): void {
  crisisInterventionsTotal.inc({ locale, category, severity });
}

/**
 * Record an error
 */
export function recordError(service: string, errorType: string, severity: 'warning' | 'error' | 'critical'): void {
  errorsTotal.inc({ service, error_type: errorType, severity });
}

/**
 * Update void weather metrics
 */
export function updateVoidWeather(
  voidId: string,
  voidName: string,
  metrics: {
    activity: number;
    sentiment: number;
    temperature: number;
  }
): void {
  voidActivityGauge.set({ void_id: voidId, void_name: voidName }, metrics.activity);
  voidSentimentGauge.set({ void_id: voidId, void_name: voidName }, metrics.sentiment);
  voidTemperatureGauge.set({ void_id: voidId, void_name: voidName }, metrics.temperature);
}

/**
 * Create a timer for measuring duration
 */
export function createTimer(histogram: Histogram<string>, labels: Record<string, string>): () => void {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    const durationSeconds = Number(end - start) / 1e9;
    histogram.observe(labels, durationSeconds);
  };
}

/**
 * Get all metrics as Prometheus format string
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Get metrics content type
 */
export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}

// Export types
export type { Registry, Counter, Gauge, Histogram, Summary };
