import { describe, expect, it } from 'vitest';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { checkAccess } from './application/check-access';
import { deleteAccount } from './application/delete-account';
import { people } from './application/people';
import type { UsersDeps } from './application/ports';
import { register } from './application/register';
import { createMemoryUsers } from './infrastructure/memory-stores';
import { noFaces } from './test-kit';

const NOW = 1_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PHONE = '998901234567';
const caller = (id: number) => ({ id, firstName: 'Ali', isAdmin: false });
const input = (id: number) => ({
  firstName: 'Ali',
  gender: 'male' as const,
  contact: { userId: id, phone: PHONE },
});
const BY = { by: 900, reason: 'complaint:c1' };

function setup() {
  const users = createMemoryUsers();
  const deps: UsersDeps = {
    users,
    avatars: createMemoryImages(),
    trips: { relation: async () => 'none' },
    ...noFaces,
    riding: async () => false,
    now: () => NOW,
    newId: () => 'id',
  };
  return { deps, users, person: people(deps) };
}

describe('a block is never weaker than before (docs/65 A5)', () => {
  it('keeps a block for good when a moderator later gives one day, by id and by phone', async () => {
    const { deps, users, person } = setup();
    await register(deps, caller(1), input(1));
    await person.block(1, null, BY);
    await person.block(1, 1, { by: 901, reason: 'admin' });
    expect(await checkAccess(deps, 1)).toEqual({ until: null });
    expect(await users.phoneBlock(`+${PHONE}`)).toEqual({ until: null });
    expect(await users.blockLog(1)).toEqual([
      { userId: 1, until: null, by: 900, reason: 'complaint:c1', at: NOW },
      { userId: 1, until: NOW + DAY_MS, by: 901, reason: 'admin', at: NOW },
    ]);
  });

  it('blocks a deleted account by its id and the phone held for an open complaint', async () => {
    const { deps, person } = setup();
    await register(deps, caller(1), input(1));
    await deleteAccount(deps, async () => ({ holdPhone: true }), caller(1));
    await person.block(1, null, BY);
    expect(await register(deps, caller(1), input(1))).toEqual({ ok: false, error: 'users.blocked' });
    expect(await register(deps, caller(2), input(2))).toEqual({ ok: false, error: 'users.blocked' });
  });
});
