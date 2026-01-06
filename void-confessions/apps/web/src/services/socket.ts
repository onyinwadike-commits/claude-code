import { io, Socket } from 'socket.io-client';
import type { VoidType, Confession, WeatherState } from '@void-confessions/core';

// Socket event types
interface ServerToClientEvents {
  'confession:new': (confession: Confession) => void;
  'confession:resonance': (data: { confessionId: string; count: number }) => void;
  'confession:echo': (data: { confessionId: string; echoCount: number }) => void;
  'weather:update': (weather: WeatherState) => void;
  'collective:update': (count: number) => void;
  'void:joined': (data: { voidType: VoidType; activeUsers: number }) => void;
  'void:left': (data: { voidType: VoidType; activeUsers: number }) => void;
  error: (error: { message: string; code: string }) => void;
}

interface ClientToServerEvents {
  'void:join': (voidType: VoidType) => void;
  'void:leave': (voidType: VoidType) => void;
  'confession:submit': (data: { content: string; voidType: VoidType; releaseStyle?: string }) => void;
  'confession:resonate': (confessionId: string) => void;
  'confession:echo': (confessionId: string) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  private get wsUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  }

  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    }) as TypedSocket;

    this.setupDefaultListeners();

    return this.socket;
  }

  private setupDefaultListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('error', { message: error.message, code: 'CONNECTION_ERROR' });
    });

    // Forward server events to local listeners
    this.socket.on('confession:new', (confession) => {
      this.emit('confession:new', confession);
    });

    this.socket.on('confession:resonance', (data) => {
      this.emit('confession:resonance', data);
    });

    this.socket.on('confession:echo', (data) => {
      this.emit('confession:echo', data);
    });

    this.socket.on('weather:update', (weather) => {
      this.emit('weather:update', weather);
    });

    this.socket.on('collective:update', (count) => {
      this.emit('collective:update', count);
    });

    this.socket.on('void:joined', (data) => {
      this.emit('void:joined', data);
    });

    this.socket.on('void:left', (data) => {
      this.emit('void:left', data);
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Server error:', error);
      this.emit('error', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Void actions
  joinVoid(voidType: VoidType): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot join void - not connected');
      return;
    }
    this.socket.emit('void:join', voidType);
  }

  leaveVoid(voidType: VoidType): void {
    if (!this.socket?.connected) return;
    this.socket.emit('void:leave', voidType);
  }

  // Confession actions
  submitConfession(content: string, voidType: VoidType, releaseStyle?: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Cannot submit confession - not connected');
      return;
    }
    this.socket.emit('confession:submit', { content, voidType, releaseStyle });
  }

  resonateConfession(confessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('confession:resonate', confessionId);
  }

  echoConfession(confessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('confession:echo', confessionId);
  }

  // Event listener management
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Socket] Error in listener for ${event}:`, error);
      }
    });
  }
}

// Singleton instance
export const socketService = new SocketService();

// React hook for socket connection
export function useSocket() {
  return socketService;
}
