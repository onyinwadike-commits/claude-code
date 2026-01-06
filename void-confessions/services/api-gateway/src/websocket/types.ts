import type { WebSocket } from 'ws';
import type {
  VoidType,
  ReleaseStyle,
  EchoWord,
  Confession,
} from '@void-confessions/core';

/**
 * Client-to-server WebSocket message types
 */
export type ClientMessageType =
  | 'join:void'
  | 'leave:void'
  | 'confession:create'
  | 'confession:resonate'
  | 'confession:echo'
  | 'ping';

/**
 * Server-to-client WebSocket message types
 */
export type ServerMessageType =
  | 'connected'
  | 'joined:void'
  | 'left:void'
  | 'confession:new'
  | 'confession:resonated'
  | 'confession:echoed'
  | 'confession:expired'
  | 'void:weather'
  | 'error'
  | 'pong';

/**
 * Base message structure for client messages
 */
export interface ClientMessage<T = unknown> {
  type: ClientMessageType;
  payload?: T;
  requestId?: string;
}

/**
 * Base message structure for server messages
 */
export interface ServerMessage<T = unknown> {
  type: ServerMessageType;
  payload?: T;
  requestId?: string;
  timestamp: number;
}

/**
 * Payload for join:void message
 */
export interface JoinVoidPayload {
  voidType: VoidType;
}

/**
 * Payload for leave:void message
 */
export interface LeaveVoidPayload {
  voidType: VoidType;
}

/**
 * Payload for confession:create message
 */
export interface CreateConfessionPayload {
  content: string;
  voidType: VoidType;
  releaseStyle?: ReleaseStyle;
  expiresInHours?: number;
}

/**
 * Payload for confession:resonate message
 */
export interface ResonatePayload {
  confessionId: string;
}

/**
 * Payload for confession:echo message
 */
export interface EchoPayload {
  confessionId: string;
  word: EchoWord;
}

/**
 * Connected client information
 */
export interface ConnectedClient {
  id: string;
  socket: WebSocket;
  subscribedVoids: Set<VoidType>;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * Confession broadcast payload
 */
export interface ConfessionBroadcast {
  confession: Omit<Confession, 'moderatorId' | 'moderationNotes' | 'sessionHash'>;
}

/**
 * Resonance broadcast payload
 */
export interface ResonanceBroadcast {
  confessionId: string;
  newCount: number;
}

/**
 * Echo broadcast payload
 */
export interface EchoBroadcast {
  confessionId: string;
  word: EchoWord;
  newCount: number;
}

/**
 * Error payload
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  totalConnections: number;
  connectionsByVoid: Record<VoidType, number>;
  uptime: number;
}
