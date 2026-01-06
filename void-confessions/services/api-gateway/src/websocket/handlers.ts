import type { VoidType, EchoWord, Confession, ReleaseStyle } from '@void-confessions/core';
import { validateConfessionContent } from '@void-confessions/core';
import { v4 as uuid } from 'uuid';
import { clientManager } from './client-manager';
import {
  publishMessage,
  getVoidChannel,
  redisSub,
  redis,
} from '../lib/redis';
import type {
  ClientMessage,
  ServerMessage,
  JoinVoidPayload,
  LeaveVoidPayload,
  CreateConfessionPayload,
  ResonatePayload,
  EchoPayload,
  ConfessionBroadcast,
  ResonanceBroadcast,
  EchoBroadcast,
  ErrorPayload,
} from './types';

/**
 * Create a server message
 */
function createServerMessage<T>(
  type: ServerMessage<T>['type'],
  payload?: T,
  requestId?: string
): ServerMessage<T> {
  return {
    type,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}

/**
 * Create an error message
 */
function createErrorMessage(
  code: string,
  message: string,
  requestId?: string,
  details?: Record<string, unknown>
): ServerMessage<ErrorPayload> {
  return createServerMessage(
    'error',
    { code, message, details },
    requestId
  );
}

/**
 * Handle join:void message
 */
export async function handleJoinVoid(
  clientId: string,
  payload: JoinVoidPayload,
  requestId?: string
): Promise<ServerMessage<unknown>> {
  const { voidType } = payload;

  // Validate void type
  const validVoidTypes: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];
  if (!validVoidTypes.includes(voidType)) {
    return createErrorMessage('INVALID_VOID_TYPE', `Invalid void type: ${voidType}`, requestId);
  }

  const success = clientManager.subscribeToVoid(clientId, voidType);
  if (!success) {
    return createErrorMessage('SUBSCRIPTION_FAILED', 'Failed to join void', requestId);
  }

  return createServerMessage('joined:void', { voidType }, requestId);
}

/**
 * Handle leave:void message
 */
export async function handleLeaveVoid(
  clientId: string,
  payload: LeaveVoidPayload,
  requestId?: string
): Promise<ServerMessage<unknown>> {
  const { voidType } = payload;

  const success = clientManager.unsubscribeFromVoid(clientId, voidType);
  if (!success) {
    return createErrorMessage('UNSUBSCRIPTION_FAILED', 'Failed to leave void', requestId);
  }

  return createServerMessage('left:void', { voidType }, requestId);
}

/**
 * Handle confession:create message
 */
export async function handleCreateConfession(
  clientId: string,
  payload: CreateConfessionPayload,
  requestId?: string
): Promise<ServerMessage<unknown>> {
  const { content, voidType, releaseStyle = 'default', expiresInHours = 24 } = payload;

  // Validate content
  const validation = validateConfessionContent(content);
  if (!validation.valid) {
    return createErrorMessage('VALIDATION_ERROR', validation.error || 'Invalid content', requestId);
  }

  // Validate void type
  const validVoidTypes: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];
  if (!validVoidTypes.includes(voidType)) {
    return createErrorMessage('INVALID_VOID_TYPE', `Invalid void type: ${voidType}`, requestId);
  }

  // Validate release style
  const validReleaseStyles: ReleaseStyle[] = [
    'default', 'burn', 'shatter', 'scream', 'dissolve', 'storm', 'drift'
  ];
  if (!validReleaseStyles.includes(releaseStyle)) {
    return createErrorMessage('INVALID_RELEASE_STYLE', `Invalid release style: ${releaseStyle}`, requestId);
  }

  // Create confession object
  const now = new Date();
  const confession: Omit<Confession, 'moderatorId' | 'moderationNotes' | 'sessionHash'> = {
    id: uuid(),
    content,
    voidType,
    releaseStyle,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000),
    updatedAt: now,
    resonanceCount: 0,
    echoes: [],
    status: 'pending',
    viewCount: 0,
    reportCount: 0,
    tags: [],
    isReleased: true,
  };

  // Store in Redis (temporary, would normally go to confession-service)
  await redis.setex(
    `confession:${confession.id}`,
    expiresInHours * 60 * 60,
    JSON.stringify(confession)
  );

  // Publish to void channel
  const channel = getVoidChannel(voidType);
  await publishMessage<ConfessionBroadcast>(
    channel,
    'confession:new',
    { confession },
    voidType
  );

  // Broadcast to all subscribers of this void
  const broadcastMessage = createServerMessage<ConfessionBroadcast>(
    'confession:new',
    { confession }
  );
  clientManager.broadcastToVoid(voidType, broadcastMessage);

  return createServerMessage('confession:new', { confession }, requestId);
}

/**
 * Handle confession:resonate message
 */
export async function handleResonate(
  clientId: string,
  payload: ResonatePayload,
  requestId?: string
): Promise<ServerMessage<unknown>> {
  const { confessionId } = payload;

  // Get confession from Redis
  const confessionData = await redis.get(`confession:${confessionId}`);
  if (!confessionData) {
    return createErrorMessage('NOT_FOUND', 'Confession not found', requestId);
  }

  const confession = JSON.parse(confessionData) as Confession;

  // Increment resonance count
  confession.resonanceCount += 1;
  confession.updatedAt = new Date();

  // Update in Redis
  const ttl = await redis.ttl(`confession:${confessionId}`);
  if (ttl > 0) {
    await redis.setex(`confession:${confessionId}`, ttl, JSON.stringify(confession));
  }

  // Publish resonance event
  const channel = getVoidChannel(confession.voidType);
  const resonancePayload: ResonanceBroadcast = {
    confessionId,
    newCount: confession.resonanceCount,
  };
  await publishMessage(channel, 'confession:resonance', resonancePayload, confession.voidType);

  // Broadcast to void subscribers
  const broadcastMessage = createServerMessage<ResonanceBroadcast>(
    'confession:resonated',
    resonancePayload
  );
  clientManager.broadcastToVoid(confession.voidType, broadcastMessage);

  return createServerMessage('confession:resonated', resonancePayload, requestId);
}

/**
 * Handle confession:echo message
 */
export async function handleEcho(
  clientId: string,
  payload: EchoPayload,
  requestId?: string
): Promise<ServerMessage<unknown>> {
  const { confessionId, word } = payload;

  // Validate echo word
  const validEchoWords: EchoWord[] = ['same', 'felt', 'brave', 'heard', 'seen', 'lighter', 'strength'];
  if (!validEchoWords.includes(word)) {
    return createErrorMessage('INVALID_ECHO_WORD', `Invalid echo word: ${word}`, requestId);
  }

  // Get confession from Redis
  const confessionData = await redis.get(`confession:${confessionId}`);
  if (!confessionData) {
    return createErrorMessage('NOT_FOUND', 'Confession not found', requestId);
  }

  const confession = JSON.parse(confessionData) as Confession;

  // Update echoes
  const existingEcho = confession.echoes.find((e) => e.word === word);
  if (existingEcho) {
    existingEcho.count += 1;
  } else {
    confession.echoes.push({ word, count: 1 });
  }
  confession.updatedAt = new Date();

  // Update in Redis
  const ttl = await redis.ttl(`confession:${confessionId}`);
  if (ttl > 0) {
    await redis.setex(`confession:${confessionId}`, ttl, JSON.stringify(confession));
  }

  // Get new count
  const newCount = confession.echoes.find((e) => e.word === word)?.count || 1;

  // Publish echo event
  const channel = getVoidChannel(confession.voidType);
  const echoPayload: EchoBroadcast = {
    confessionId,
    word,
    newCount,
  };
  await publishMessage(channel, 'confession:echo', echoPayload, confession.voidType);

  // Broadcast to void subscribers
  const broadcastMessage = createServerMessage<EchoBroadcast>(
    'confession:echoed',
    echoPayload
  );
  clientManager.broadcastToVoid(confession.voidType, broadcastMessage);

  return createServerMessage('confession:echoed', echoPayload, requestId);
}

/**
 * Handle ping message
 */
export function handlePing(
  clientId: string,
  requestId?: string
): ServerMessage<unknown> {
  clientManager.updateActivity(clientId);
  return createServerMessage('pong', undefined, requestId);
}

/**
 * Route incoming messages to appropriate handlers
 */
export async function handleMessage(
  clientId: string,
  message: ClientMessage
): Promise<ServerMessage<unknown>> {
  const { type, payload, requestId } = message;

  try {
    switch (type) {
      case 'join:void':
        return handleJoinVoid(clientId, payload as JoinVoidPayload, requestId);
      case 'leave:void':
        return handleLeaveVoid(clientId, payload as LeaveVoidPayload, requestId);
      case 'confession:create':
        return handleCreateConfession(clientId, payload as CreateConfessionPayload, requestId);
      case 'confession:resonate':
        return handleResonate(clientId, payload as ResonatePayload, requestId);
      case 'confession:echo':
        return handleEcho(clientId, payload as EchoPayload, requestId);
      case 'ping':
        return handlePing(clientId, requestId);
      default:
        return createErrorMessage('UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${type}`, requestId);
    }
  } catch (error) {
    console.error(`Error handling message type ${type}:`, error);
    return createErrorMessage(
      'INTERNAL_ERROR',
      'An internal error occurred',
      requestId,
      { originalType: type }
    );
  }
}

/**
 * Set up Redis subscription handlers for cross-server messaging
 */
export async function setupRedisSubscriptions(): Promise<void> {
  const voidTypes: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];
  const channels = voidTypes.map(getVoidChannel);

  // Subscribe to all void channels
  await redisSub.subscribe(...channels);

  redisSub.on('message', (channel, message) => {
    try {
      const parsed = JSON.parse(message);
      const voidType = channel.replace('void:', '') as VoidType;

      // Broadcast to local clients
      // (The handler already broadcasts, but this handles cross-server scenarios)
      // In a production setup, you'd check if the message originated from this server
      console.log(`Redis message on ${channel}:`, parsed.type);
    } catch (error) {
      console.error('Error processing Redis message:', error);
    }
  });

  console.log(`Subscribed to Redis channels: ${channels.join(', ')}`);
}
