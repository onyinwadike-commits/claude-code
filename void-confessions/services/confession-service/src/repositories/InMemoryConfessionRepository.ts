import type { Confession } from '@void-confessions/core';
import type { ConfessionRepository } from './ConfessionRepository';

export class InMemoryConfessionRepository implements ConfessionRepository {
  private confessions: Map<string, Confession> = new Map();

  async findAll(): Promise<Confession[]> {
    return Array.from(this.confessions.values());
  }

  async findById(id: string): Promise<Confession | null> {
    return this.confessions.get(id) || null;
  }

  async save(confession: Confession): Promise<void> {
    this.confessions.set(confession.id, confession);
  }

  async delete(id: string): Promise<void> {
    this.confessions.delete(id);
  }
}
