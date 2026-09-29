import type { Gender } from '@platform/contracts';
import type { User } from '../domain/user';
import type { UsersDeps } from './ports';

// What other modules may know about a person: never the phone (docs/07).
export type Person = {
  readonly id: number;
  readonly firstName: string;
  readonly avatarKey: string | null;
  // Only for "Mashinada ayol bor" (docs/06): never shown to other people.
  readonly gender: Gender;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The users module as other modules see it (drivers, moderation). They never touch its tables.
export function people(deps: UsersDeps) {
  const update = async (id: number, change: Partial<User>) => {
    const user = await deps.users.find(id);
    if (user) await deps.users.save({ ...user, ...change, updatedAt: deps.now() });
  };
  return {
    find: async (id: number): Promise<Person | undefined> => {
      const user = await deps.users.find(id);
      if (!user) return undefined;
      return { id: user.id, firstName: user.firstName, avatarKey: user.avatarKey, gender: user.gender };
    },
    // Only an approved driver may publish trips (docs/04).
    setDriver: (id: number, isDriver: boolean) => update(id, { isDriver }),
    // days: 1, 7 or 30; null blocks for good. The phone is blocked too: a new account with the same
    // number cannot come back (docs/17).
    block: async (id: number, days: number | null) => {
      const now = deps.now();
      const block = { until: days === null ? null : now + days * DAY_MS };
      await update(id, { block });
      const user = await deps.users.find(id);
      if (user) await deps.users.blockPhone(user.phone, block, now);
    },
    avatar: (key: string) => deps.avatars.get(key),
  };
}
