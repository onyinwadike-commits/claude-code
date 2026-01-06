import Redis from 'ioredis';
import type { VoidType, Confession, EchoWord } from '@void-confessions/core';

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
 * Dedicated Redis client for publishing
 */
export const redisPub = new Redis({
  ...defaultConfig,
  lazyConnect: true,
});

/**
 * Key prefixes
 */
const KEYS = {
  confession: (id: string) => `confession:${id}`,
  moderationQueue: 'moderation:queue',
  voidChannel: (voidType: VoidType) => `void:${voidType}`,
  resonance: (confessionId: string) => `resonance:${confessionId}`,
  echo: (confessionId: string, word: EchoWord) => `echo:${confessionId}:${word}`,
  echoSet: (confessionId: string) => `echoes:${confessionId}`,
  userEcho: (confessionId: string, sessionHash: string) => `user_echo:${confessionId}:${sessionHash}`,
} as const;

export { KEYS };

/**
 * Pub/sub channel names
 */
export const CHANNELS = {
  moderationQueue: 'channel:moderation:queue',
  voidStream: (voidType: VoidType) => `channel:void:${voidType}`,
  confessionUpdate: (confessionId: string) => `channel:confession:${confessionId}`,
} as const;

/**
 * Message types for pub/sub
 */
export type PubSubEventType =
  | 'confession:pending'
  | 'confession:approved'
  | 'confession:new'
  | 'confession:resonance'
  | 'confession:echo'
  | 'confession:expired';

export interface PubSubMessage<T = unknown> {
  type: PubSubEventType;
  payload: T;
  timestamp: number;
}

/**
 * Publish a message to a channel
 */
export async function publishMessage<T>(
  channel: string,
  type: PubSubEventType,
  payload: T
): Promise<void> {
  const message: PubSubMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };
  await redisPub.publish(channel, JSON.stringify(message));
}

/**
 * Store a confession in Redis with TTL
 */
export async function storeConfession(
  confession: Confession,
  ttlSeconds: number
): Promise<void> {
  const key = KEYS.confession(confession.id);
  await redis.setex(key, ttlSeconds, JSON.stringify(confession));
}

/**
 * Get a confession from Redis
 */
export async function getConfession(id: string): Promise<Confession | null> {
  const key = KEYS.confession(id);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as Confession;
}

/**
 * Update a confession in Redis (preserving TTL)
 */
export async function updateConfession(confession: Confession): Promise<boolean> {
  const key = KEYS.confession(confession.id);
  const ttl = await redis.ttl(key);
  if (ttl <= 0) return false;

  await redis.setex(key, ttl, JSON.stringify(confession));
  return true;
}

/**
 * Add confession to moderation queue
 */
export async function addToModerationQueue(confessionId: string): Promise<void> {
  await redis.lpush(KEYS.moderationQueue, confessionId);
}

/**
 * Increment resonance counter
 */
export async function incrementResonance(confessionId: string): Promise<number> {
  const key = KEYS.resonance(confessionId);
  return redis.incr(key);
}

/**
 * Get resonance count
 */
export async function getResonanceCount(confessionId: string): Promise<number> {
  const key = KEYS.resonance(confessionId);
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Add an echo to a confession
 */
export async function addEcho(
  confessionId: string,
  word: EchoWord,
  sessionHash?: string
): Promise<{ success: boolean; newCount: number; alreadyEchoed?: boolean }> {
  // Check if user already echoed this word (if session hash provided)
  if (sessionHash) {
    const userEchoKey = KEYS.userEcho(confessionId, sessionHash);
    const existing = await redis.sismember(userEchoKey, word);
    if (existing) {
      const count = await redis.hget(KEYS.echoSet(confessionId), word);
      return { success: false, newCount: count ? parseInt(count, 10) : 0, alreadyEchoed: true };
    }
    // Mark that user has echoed this word
    await redis.sadd(userEchoKey, word);
    await redis.expire(userEchoKey, 86400); // 24 hour TTL
  }

  // Increment echo count
  const newCount = await redis.hincrby(KEYS.echoSet(confessionId), word, 1);
  return { success: true, newCount };
}

/**
 * Get all echoes for a confession
 */
export async function getEchoes(confessionId: string): Promise<Record<EchoWord, number>> {
  const key = KEYS.echoSet(confessionId);
  const echoes = await redis.hgetall(key);
  const result: Record<string, number> = {};
  for (const [word, count] of Object.entries(echoes)) {
    result[word] = parseInt(count, 10);
  }
  return result as Record<EchoWord, number>;
}

/**
 * Connect Redis clients
 */
export async function connectRedis(): Promise<void> {
  try {
    await Promise.all([redis.connect(), redisPub.connect()]);
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
}

/**
 * Disconnect Redis clients
 */
export async function disconnectRedis(): Promise<void> {
  await Promise.all([redis.quit(), redisPub.quit()]);
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
