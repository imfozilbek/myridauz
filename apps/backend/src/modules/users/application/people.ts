import type { User } from '../domain/user';
import type { UsersDeps } from './ports';

// What other modules may know about a person: never the phone (docs/07).
export type Person = { readonly id: number; readonly firstName: string; readonly avatarKey: string | null };

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
      return user ? { id: user.id, firstName: user.firstName, avatarKey: user.avatarKey } : undefined;
    },
    // Only an approved driver may publish trips (docs/04).
    setDriver: (id: number, isDriver: boolean) => update(id, { isDriver }),
    // days: 1, 7 or 30; null blocks for good (docs/17).
    block: (id: number, days: number | null) =>
      update(id, { block: { until: days === null ? null : deps.now() + days * DAY_MS } }),
    avatar: (key: string) => deps.avatars.get(key),
  };
}

export type People = ReturnType<typeof people>;
