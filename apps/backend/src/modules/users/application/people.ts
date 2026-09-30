import type { Gender } from '@platform/contracts';
import { activeBlock, type Block, type User } from '../domain/user';
import type { UsersDeps } from './ports';

// What other modules may know about a person: never the phone (docs/07).
export type Person = {
  readonly id: number;
  // The only id other people see (docs/65 A3).
  readonly publicId: string;
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
      const { publicId, firstName, avatarKey, gender } = user;
      return { id: user.id, publicId, firstName, avatarKey, gender };
    },
    // The Telegram ID behind a public id from a path; undefined: no such person (docs/65 A3).
    idOf: async (publicId: string) => (await deps.users.byPublicId(publicId))?.id,
    // Only an approved driver may publish trips (docs/04).
    setDriver: (id: number, isDriver: boolean) => update(id, { isDriver }),
    // days: 1, 7 or 30; null blocks for good. The phone is blocked too: a new account with the same
    // number cannot come back (docs/17). A block is never weaker than the one before, and it works on
    // a deleted account by its id and its held phone (docs/65 A5).
    block: async (
      id: number,
      days: number | null,
      cause: { readonly by: number; readonly reason: string },
    ) => {
      const now = deps.now();
      const wanted = { until: days === null ? null : now + days * DAY_MS };
      const stronger = (before: Block | null) => activeBlock([before, wanted], now) ?? wanted;
      await deps.users.blockId(id, stronger(await deps.users.idBlock(id)), now);
      const phone = (await deps.users.find(id))?.phone ?? (await deps.users.heldPhone(id));
      if (phone) await deps.users.blockPhone(phone, stronger(await deps.users.phoneBlock(phone)), now);
      await deps.users.logBlock({ userId: id, until: wanted.until, ...cause, at: now });
    },
    // The owner lifts a block; the journal keeps it: "until" is the moment it was lifted (docs/65 C).
    unblock: async (id: number, cause: { readonly by: number; readonly reason: string }) => {
      const now = deps.now();
      await deps.users.unblockId(id, now);
      const phone = (await deps.users.find(id))?.phone ?? (await deps.users.heldPhone(id));
      if (phone) await deps.users.unblockPhone(phone);
      await deps.users.logBlock({ userId: id, until: now, ...cause, at: now });
    },
    // The block now and every block before it, for the team (docs/65 C).
    blocks: async (id: number) => ({
      active: activeBlock([await deps.users.idBlock(id)], deps.now()),
      entries: await deps.users.blockLog(id),
    }),
    // The complaint against a deleted account ended: its phone is not kept any more (docs/58).
    releasePhone: (id: number) => deps.users.releasePhone(id),
    avatar: (key: string) => deps.avatars.get(key),
  };
}
