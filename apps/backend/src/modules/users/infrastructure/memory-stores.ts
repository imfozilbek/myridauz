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
  const invited = new Set<number>();
  return {
    find: async (id) => users.get(id),
    byPublicId: async (publicId) => [...users.values()].find((user) => user.publicId === publicId),
    // As in D1: a new person comes with the block, a change keeps the block there is.
    save: async (user) => {
      const old = users.get(user.id);
      users.set(user.id, old ? { ...user, block: old.block } : user);
      if (!old && user.block) idBlocks.set(user.id, user.block);
    },
    decideFace: async (id, face, at) => {
      const user = users.get(id);
      if (user?.face?.status !== 'pending' || user.face.at !== at) return false;
      users.set(id, { ...user, face });
      return true;
    },
    erase: async (id) => void users.delete(id),
    // Local runs show no sources: «Statistika» reads them from D1 only (G55).
    arrived: async () => undefined,
    phoneBlock: async (phone) => phoneBlocks.get(phone) ?? null,
    blockPhone: async (phone, block) => void phoneBlocks.set(phone, block),
    idBlock: async (id) => idBlocks.get(id) ?? null,
    blockId: async (id, block) => {
      idBlocks.set(id, block);
      const user = users.get(id);
      if (user) users.set(id, { ...user, block });
    },
    unblockId: async (id) => {
      idBlocks.delete(id);
      const user = users.get(id);
      if (user) users.set(id, { ...user, block: null });
    },
    unblockPhone: async (phone) => void phoneBlocks.delete(phone),
    holdPhone: async (id, phone) => void held.set(id, phone),
    heldPhone: async (id) => held.get(id) ?? null,
    releasePhone: async (id) => void held.delete(id),
    logBlock: async (entry) => void log.push(entry),
    blockLog: async (id) => log.filter((entry) => entry.userId === id),
    pendingFaces: async () =>
      [...users.values()]
        .filter((user) => user.face?.status === 'pending')
        .sort((a, b) => (a.face?.at ?? 0) - (b.face?.at ?? 0)),
    claimZoneInvite: async (id) => {
      if (!users.has(id) || invited.has(id)) return false;
      invited.add(id);
      return true;
    },
  };
}

// Trips arrive in G07: until then nobody shares a trip with anybody.
