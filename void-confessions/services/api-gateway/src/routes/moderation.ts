import type { FastifyPluginAsync } from 'fastify';
import type {
  Confession,
  ModerationAction,
  ModerationStats,
  ApiResponse,
} from '@void-confessions/core';

export const moderationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get moderation queue
  fastify.get<{
    Reply: ApiResponse<Confession[]>;
  }>('/queue', async (_request, reply) => {
    // TODO: Forward to confession-service
    return reply.send({
      success: true,
      data: [],
    });
  });

  // Get moderation stats
  fastify.get<{
    Reply: ApiResponse<ModerationStats>;
  }>('/stats', async (_request, reply) => {
    // TODO: Forward to confession-service
    return reply.send({
      success: true,
      data: {
        pending: 0,
        approvedToday: 0,
        rejectedToday: 0,
        averageResponseTime: 0,
      },
    });
  });

  // Perform moderation action
  fastify.post<{
    Params: { id: string };
    Body: { action: ModerationAction; reason?: string };
    Reply: ApiResponse<Confession>;
  }>('/:id/action', async (request, reply) => {
    const { id } = request.params;
    const { action, reason } = request.body;

    // Validate action
    const validActions: ModerationAction[] = ['approve', 'reject', 'flag', 'redact'];
    if (!validActions.includes(action)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`,
        },
      });
    }

    // TODO: Forward to confession-service
    return reply.send({
      success: true,
      data: {
        id,
        content: '',
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        moderatorId: 'current-user',
        moderationNotes: reason,
        viewCount: 0,
        reportCount: 0,
        tags: [],
      },
    });
  });
};
