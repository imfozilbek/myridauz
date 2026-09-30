import type { ShareRepository } from '../application/ports';
import type { ShareRecord, ShareSubject } from '../domain/share';

const keyOf = (subject: ShareSubject) => `${subject.kind}:${subject.id}`;

// In memory: tests and local runs without D1.
export function createMemoryShares(): ShareRepository {
  const shares = new Map<string, ShareRecord>();
  const followers = new Map<string, number[]>();
  return {
    save: async (share) => void shares.set(share.tokenHash, share),
    find: async (tokenHash) => shares.get(tokenHash),
    revoke: async (subject, at) => {
      for (const share of shares.values())
        if (keyOf(share.subject) === keyOf(subject) && share.revokedAt === null)
          shares.set(share.tokenHash, { ...share, revokedAt: at });
      followers.delete(keyOf(subject));
    },
    followers: async (subject) => followers.get(keyOf(subject)) ?? [],
    follow: async (subject, telegramId) => {
      const list = followers.get(keyOf(subject)) ?? [];
      if (!list.includes(telegramId)) followers.set(keyOf(subject), [...list, telegramId]);
    },
  };
}
