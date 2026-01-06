import Redis from 'ioredis';
import type { VoidType } from '@void-confessions/core';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

const defaultConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
};

/**
 * Redis client for general operations
 */
export const redis = new Redis({
  ...defaultConfig,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('Redis connection failed after 10 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

/**
 * Dedicated Redis client for pub/sub subscriptions
 */
export const redisSub = new Redis({
  ...defaultConfig,
  lazyConnect: true,
});

/**
 * Dedicated Redis client for publishing
 */
export const redisPub = new Redis({
  ...defaultConfig,
  lazyConnect: true,
});

/**
 * Channel names for void types
 */
export function getVoidChannel(voidType: VoidType): string {
  return `void:${voidType}`;
}

/**
 * Channel for confession events
 */
export function getConfessionChannel(confessionId: string): string {
  return `confession:${confessionId}`;
}

/**
 * Channel for global events
 */
export const GLOBAL_CHANNEL = 'void:global';

/**
 * Event types for pub/sub messages
 */
export type PubSubEventType =
  | 'confession:new'
  | 'confession:resonance'
  | 'confession:echo'
  | 'confession:expired'
  | 'void:weather_change';

export interface PubSubMessage<T = unknown> {
  type: PubSubEventType;
  voidType?: VoidType;
  payload: T;
  timestamp: number;
}

/**
 * Publish a message to a channel
 */
export async function publishMessage<T>(
  channel: string,
  type: PubSubEventType,
  payload: T,
  voidType?: VoidType
): Promise<void> {
  const message: PubSubMessage<T> = {
    type,
    voidType,
    payload,
    timestamp: Date.now(),
  };
  await redisPub.publish(channel, JSON.stringify(message));
}

/**
 * Connect all Redis clients
 */
export async function connectRedis(): Promise<void> {
  try {
    await Promise.all([redis.connect(), redisSub.connect(), redisPub.connect()]);
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect all Redis clients
 */
export async function disconnectRedis(): Promise<void> {
  await Promise.all([redis.quit(), redisSub.quit(), redisPub.quit()]);
  console.log('Redis disconnected');
}

/**
 * Check Redis health
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
