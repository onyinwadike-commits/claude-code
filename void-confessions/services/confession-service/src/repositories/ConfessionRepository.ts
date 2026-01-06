import type { Confession } from '@void-confessions/core';

export interface ConfessionRepository {
  findAll(): Promise<Confession[]>;
  findById(id: string): Promise<Confession | null>;
  save(confession: Confession): Promise<void>;
  delete(id: string): Promise<void>;
}
