import type { ShareRepository } from '../application/ports';
import type { ShareRecord } from '../domain/share';

// In memory: tests and local runs without D1.
export function createMemoryShares(): ShareRepository {
  const shares = new Map<string, ShareRecord>();
  const followers = new Map<string, number[]>();
  return {
    save: async (share) => void shares.set(share.tokenHash, share),
    find: async (tokenHash) => shares.get(tokenHash),
    revoke: async (bookingId, at) => {
      for (const share of shares.values())
        if (share.bookingId === bookingId && share.revokedAt === null)
          shares.set(share.tokenHash, { ...share, revokedAt: at });
      followers.delete(bookingId);
    },
    followers: async (bookingId) => followers.get(bookingId) ?? [],
    follow: async (bookingId, telegramId) => {
      const list = followers.get(bookingId) ?? [];
      if (!list.includes(telegramId)) followers.set(bookingId, [...list, telegramId]);
    },
  };
}
