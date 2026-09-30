import type { UserRepository } from '../application/ports';
import type { Block, BlockEntry, User } from '../domain/user';

// In memory: tests and local runs without D1 and R2.
export function createMemoryUsers(): UserRepository {
  const users = new Map<number, User>();
  const phoneBlocks = new Map<string, Block>();
  // A deleted account keeps its id block, like the row that stays in D1.
  const idBlocks = new Map<number, Block>();
  const held = new Map<number, string>();
  const log: BlockEntry[] = [];
  return {
    find: async (id) => users.get(id),
    byPublicId: async (publicId) => [...users.values()].find((user) => user.publicId === publicId),
    save: async (user) => {
      users.set(user.id, user);
      if (user.block) idBlocks.set(user.id, user.block);
      else idBlocks.delete(user.id);
    },
    erase: async (id) => void users.delete(id),
    phoneBlock: async (phone) => phoneBlocks.get(phone) ?? null,
    blockPhone: async (phone, block) => void phoneBlocks.set(phone, block),
    idBlock: async (id) => idBlocks.get(id) ?? null,
    blockId: async (id, block) => {
      idBlocks.set(id, block);
      const user = users.get(id);
      if (user) users.set(id, { ...user, block });
    },
    holdPhone: async (id, phone) => void held.set(id, phone),
    heldPhone: async (id) => held.get(id) ?? null,
    releasePhone: async (id) => void held.delete(id),
    logBlock: async (entry) => void log.push(entry),
    blockLog: async (id) => log.filter((entry) => entry.userId === id),
  };
}

// Trips arrive in G07: until then nobody shares a trip with anybody.
