import { createMemoryImages } from '../../shared/storage/memory-images';
import type { TripRelations, UsersDeps } from './application/ports';
import { createMemoryUsers } from './infrastructure/memory-stores';

// Test helper: the users module in memory, and what it told the team and the person.
export const NOW = 1_000_000;
export const ali = { id: 1, firstName: 'Ali', isAdmin: false };
export const input = {
  firstName: 'Ali',
  gender: 'male' as const,
  contact: { userId: 1, phone: '998901234567' },
};
export const jpeg = (size: number) => ({ body: new ArrayBuffer(size), type: 'image/jpeg' });

// For tests that do not look at the face check (G51).
export const noFaces = {
  faceLog: { add: async () => undefined },
  faces: { uploaded: async () => undefined, rejected: async () => undefined },
};

export function setup(relation: Awaited<ReturnType<TripRelations['relation']>> = 'none') {
  const users = createMemoryUsers();
  const avatars = createMemoryImages();
  let id = 0;
  const told: string[] = [];
  const deps: UsersDeps = {
    users,
    avatars,
    trips: { relation: async () => relation },
    faceLog: { add: async (entry) => void told.push(`log:${entry.status}:${entry.reason}:${entry.by}`) },
    faces: {
      uploaded: async (user) => void told.push(`card:${user.id}`),
      rejected: async (user, reason) => void told.push(`rejected:${user.id}:${reason}`),
    },
    now: () => NOW,
    newId: () => `id${(id += 1)}`,
  };
  const stored = async (userId: number) => {
    const user = await users.find(userId);
    if (!user) throw new Error('test.user_missing');
    return user;
  };
  return { deps, users, avatars, stored, told };
}
