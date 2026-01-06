import type { FastifyPluginAsync } from 'fastify';
import { clientManager, handleMessage } from '../websocket';
import type { ClientMessage, ServerMessage } from '../websocket/types';

export const streamRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * WebSocket endpoint for real-time confession streaming
   *
   * Connect: ws://host:port/api/v1/stream/ws
   *
   * Client Messages:
   * - { type: 'join:void', payload: { voidType: 'grief' | 'rage' | 'guilt' | 'longing' | 'relief' } }
   * - { type: 'leave:void', payload: { voidType: '...' } }
   * - { type: 'confession:create', payload: { content, voidType, releaseStyle?, expiresInHours? } }
   * - { type: 'confession:resonate', payload: { confessionId } }
   * - { type: 'confession:echo', payload: { confessionId, word } }
   * - { type: 'ping' }
   *
   * Server Messages:
   * - { type: 'connected', payload: { clientId } }
   * - { type: 'joined:void', payload: { voidType } }
   * - { type: 'left:void', payload: { voidType } }
   * - { type: 'confession:new', payload: { confession } }
   * - { type: 'confession:resonated', payload: { confessionId, newCount } }
   * - { type: 'confession:echoed', payload: { confessionId, word, newCount } }
   * - { type: 'error', payload: { code, message } }
   * - { type: 'pong' }
   */
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const clientId = clientManager.addClient(socket);

    fastify.log.info(`WebSocket client connected: ${clientId} from ${request.ip}`);

    // Send connected confirmation
    const connectedMessage: ServerMessage<{ clientId: string }> = {
      type: 'connected',
      payload: { clientId },
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(connectedMessage));

    // Handle incoming messages
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as ClientMessage;
        fastify.log.debug({ clientId, messageType: message.type }, 'Received WebSocket message');

        const response = await handleMessage(clientId, message);
        socket.send(JSON.stringify(response));
      } catch (error) {
        fastify.log.error({ clientId, error }, 'Error parsing WebSocket message');

        const errorResponse: ServerMessage<{ code: string; message: string }> = {
          type: 'error',
          payload: {
            code: 'PARSE_ERROR',
            message: 'Invalid message format',
          },
          timestamp: Date.now(),
        };
        socket.send(JSON.stringify(errorResponse));
      }
    });

    // Handle close
    socket.on('close', (code, reason) => {
      fastify.log.info(
        { clientId, code, reason: reason.toString() },
        'WebSocket client disconnected'
      );
      clientManager.removeClient(clientId);
    });

    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error({ clientId, error }, 'WebSocket error');
      clientManager.removeClient(clientId);
    });
  });

  /**
   * Get WebSocket connection statistics
   */
  fastify.get('/stats', async () => {
    const stats = clientManager.getStats();
    return {
      success: true,
      data: stats,
    };
  });
};
