import type {
  Confession,
  ConfessionStatus,
  CreateConfessionInput,
  ModerationStats,
} from '@void-confessions/core';
import type { ConfessionRepository } from '../repositories/ConfessionRepository';

interface GetConfessionsOptions {
  status?: string;
  page: number;
  limit: number;
}

export class ConfessionService {
  constructor(private repository: ConfessionRepository) {}

  async getConfessions(options: GetConfessionsOptions): Promise<Confession[]> {
    const { status, page, limit } = options;
    let confessions = await this.repository.findAll();

    if (status) {
      confessions = confessions.filter((c) => c.status === status);
    }

    const start = (page - 1) * limit;
    return confessions.slice(start, start + limit);
  }

  async getConfessionById(id: string): Promise<Confession | null> {
    return this.repository.findById(id);
  }

  async createConfession(input: CreateConfessionInput): Promise<Confession> {
    const confession: Confession = {
      id: this.generateId(),
      content: input.content,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      reportCount: 0,
      tags: input.tags || [],
    };

    await this.repository.save(confession);

    // TODO: Call redaction-service to redact PII
    // TODO: Call sentiment-service to analyze sentiment

    return confession;
  }

  async updateStatus(
    id: string,
    status: ConfessionStatus,
    moderatorId: string,
    notes?: string
  ): Promise<Confession | null> {
    const confession = await this.repository.findById(id);
    if (!confession) {
      return null;
    }

    confession.status = status;
    confession.moderatorId = moderatorId;
    confession.moderationNotes = notes;
    confession.updatedAt = new Date();

    if (status === 'approved') {
      confession.approvedAt = new Date();
    } else if (status === 'rejected') {
      confession.rejectedAt = new Date();
    }

    await this.repository.save(confession);
    return confession;
  }

  async getModerationQueue(): Promise<Confession[]> {
    const confessions = await this.repository.findAll();
    return confessions
      .filter((c) => c.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getModerationStats(): Promise<ModerationStats> {
    const confessions = await this.repository.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = confessions.filter((c) => c.status === 'pending').length;
    const approvedToday = confessions.filter(
      (c) => c.status === 'approved' && c.approvedAt && c.approvedAt >= today
    ).length;
    const rejectedToday = confessions.filter(
      (c) => c.status === 'rejected' && c.rejectedAt && c.rejectedAt >= today
    ).length;

    return {
      pending,
      approvedToday,
      rejectedToday,
      averageResponseTime: 0, // TODO: Calculate actual average
    };
  }

  private generateId(): string {
    return `conf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
