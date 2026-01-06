import type { FastifyPluginAsync } from 'fastify';
import type {
  Confession,
  CreateConfessionInput,
  ApiResponse,
  PaginationParams,
} from '@void-confessions/core';
import { validateConfessionContent } from '@void-confessions/core';

export const confessionRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all approved confessions
  fastify.get<{
    Querystring: PaginationParams;
    Reply: ApiResponse<Confession[]>;
  }>('/', async (request, reply) => {
    const { page = 1, limit = 20 } = request.query;

    // TODO: Forward to confession-service
    return reply.send({
      success: true,
      data: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  });

  // Get single confession
  fastify.get<{
    Params: { id: string };
    Reply: ApiResponse<Confession>;
  }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // TODO: Forward to confession-service
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Confession ${id} not found`,
      },
    });
  });

  // Create new confession
  fastify.post<{
    Body: CreateConfessionInput;
    Reply: ApiResponse<Confession>;
  }>('/', async (request, reply) => {
    const { content, tags } = request.body;

    // Validate content
    const validation = validateConfessionContent(content);
    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Invalid content',
        },
      });
    }

    // TODO: Forward to confession-service for processing
    // The service will then call redaction-service and sentiment-service

    return reply.status(201).send({
      success: true,
      data: {
        id: 'temp-id',
        content,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        viewCount: 0,
        reportCount: 0,
        tags: tags || [],
      },
    });
  });
};
