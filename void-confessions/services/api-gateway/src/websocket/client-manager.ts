import type { WebSocket } from 'ws';
import type { VoidType } from '@void-confessions/core';
import { v4 as uuid } from 'uuid';
import type {
  ConnectedClient,
  ServerMessage,
  ConnectionStats,
} from './types';

/**
 * Manages all connected WebSocket clients
 */
export class ClientManager {
  private clients: Map<string, ConnectedClient> = new Map();
  private voidSubscriptions: Map<VoidType, Set<string>> = new Map();
  private startTime: Date = new Date();

  constructor() {
    // Initialize void subscription sets
    const voidTypes: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];
    for (const voidType of voidTypes) {
      this.voidSubscriptions.set(voidType, new Set());
    }
  }

  /**
   * Register a new client connection
   */
  addClient(socket: WebSocket): string {
    const clientId = uuid();
    const client: ConnectedClient = {
      id: clientId,
      socket,
      subscribedVoids: new Set(),
      connectedAt: new Date(),
      lastActivity: new Date(),
    };
    this.clients.set(clientId, client);
    return clientId;
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Remove from all void subscriptions
      for (const voidType of client.subscribedVoids) {
        this.voidSubscriptions.get(voidType)?.delete(clientId);
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * Get a client by ID
   */
  getClient(clientId: string): ConnectedClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Subscribe a client to a void channel
   */
  subscribeToVoid(clientId: string, voidType: VoidType): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscribedVoids.add(voidType);
    this.voidSubscriptions.get(voidType)?.add(clientId);
    client.lastActivity = new Date();
    return true;
  }

  /**
   * Unsubscribe a client from a void channel
   */
  unsubscribeFromVoid(clientId: string, voidType: VoidType): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscribedVoids.delete(voidType);
    this.voidSubscriptions.get(voidType)?.delete(clientId);
    client.lastActivity = new Date();
    return true;
  }

  /**
   * Get all clients subscribed to a void type
   */
  getVoidSubscribers(voidType: VoidType): ConnectedClient[] {
    const subscriberIds = this.voidSubscriptions.get(voidType);
    if (!subscriberIds) return [];

    const subscribers: ConnectedClient[] = [];
    for (const clientId of subscriberIds) {
      const client = this.clients.get(clientId);
      if (client) {
        subscribers.push(client);
      }
    }
    return subscribers;
  }

  /**
   * Send a message to a specific client
   */
  sendToClient<T>(clientId: string, message: ServerMessage<T>): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== 1) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast a message to all clients subscribed to a void type
   */
  broadcastToVoid<T>(voidType: VoidType, message: ServerMessage<T>): number {
    const subscribers = this.getVoidSubscribers(voidType);
    let sent = 0;

    for (const client of subscribers) {
      if (this.sendToClient(client.id, message)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcastToAll<T>(message: ServerMessage<T>): number {
    let sent = 0;
    for (const [clientId] of this.clients) {
      if (this.sendToClient(clientId, message)) {
        sent++;
      }
    }
    return sent;
  }

  /**
   * Update client activity timestamp
   */
  updateActivity(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    const connectionsByVoid: Record<VoidType, number> = {
      grief: 0,
      rage: 0,
      guilt: 0,
      longing: 0,
      relief: 0,
    };

    for (const [voidType, subscribers] of this.voidSubscriptions) {
      connectionsByVoid[voidType] = subscribers.size;
    }

    return {
      totalConnections: this.clients.size,
      connectionsByVoid,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Clean up stale connections (no activity for 5 minutes)
   */
  cleanupStaleConnections(): number {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    let cleaned = 0;

    for (const [clientId, client] of this.clients) {
      if (now - client.lastActivity.getTime() > staleThreshold) {
        if (client.socket.readyState === 1) {
          client.socket.close(1000, 'Connection timed out');
        }
        this.removeClient(clientId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton instance
export const clientManager = new ClientManager();
