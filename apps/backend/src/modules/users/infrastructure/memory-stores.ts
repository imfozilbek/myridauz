import type { UserRepository } from '../application/ports';
import type { Block, User } from '../domain/user';

// In memory: tests and local runs without D1 and R2.
export function createMemoryUsers(): UserRepository & {
  blockPhone(phone: string, block: Block): void;
} {
  const users = new Map<number, User>();
  const phoneBlocks = new Map<string, Block>();
  return {
    find: async (id) => users.get(id),
    save: async (user) => void users.set(user.id, user),
    phoneBlock: async (phone) => phoneBlocks.get(phone) ?? null,
    blockPhone: (phone, block) => void phoneBlocks.set(phone, block),
  };
}

// Trips arrive in G07: until then nobody shares a trip with anybody.
