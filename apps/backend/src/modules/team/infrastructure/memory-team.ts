import type { TeamRepository } from '../application/team';

// In memory: tests and local runs without D1.
export function createMemoryTeam(): TeamRepository {
  const moderators = new Set<number>();
  return {
    moderators: async () => [...moderators],
    isModerator: async (userId) => moderators.has(userId),
    add: async (userId) => void moderators.add(userId),
    remove: async (userId) => void moderators.delete(userId),
  };
}
