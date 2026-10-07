import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import type { User } from './domain/user';
import { d1FaceLog } from './infrastructure/d1-face-log';
import { d1Users } from './infrastructure/d1-users';

const person = (id: number, face: User['face']): User => ({
  id,
  publicId: `p${id}`,
  firstName: `P${id}`,
  gender: 'female',
  phone: `+99890000000${id}`,
  locale: 'uz-Latn',
  isDriver: false,
  consentAt: 1,
  block: null,
  avatarKey: face ? `avatars/${id}/a` : null,
  face,
  writeAccess: false,
  createdAt: 1,
  updatedAt: 1,
});

// The check of face photos in D1 (G51): by the index, never every person (G56, docs/117).
describe('face photos and the zone invite in D1', () => {
  it('keeps the check of a photo and lists the waiting ones, the oldest first', async () => {
    const db = testD1();
    const users = d1Users(db);
    await users.save(person(1, { status: 'pending', reason: null, at: 30 }));
    await users.save(person(2, { status: 'pending', reason: null, at: 20 }));
    await users.save(person(3, { status: 'rejected', reason: 'not_one_person', at: 10 }));
    await users.save(person(4, null));
    expect((await users.find(3))?.face).toEqual({ status: 'rejected', reason: 'not_one_person', at: 10 });
    expect((await users.find(4))?.face).toBeNull();
    expect((await users.pendingFaces()).map((user) => user.id)).toEqual([2, 1]);
    await d1FaceLog(db).add({ userId: 3, status: 'rejected', reason: 'not_one_person', by: 900, at: 11 });
    const logged = await db
      .prepare('SELECT user_id, status, reason, decided_by FROM face_log WHERE user_id = 3')
      .first();
    expect(logged).toEqual({ user_id: 3, status: 'rejected', reason: 'not_one_person', decided_by: 900 });
    expect(fullScans(db)).toEqual([]);
  });

  it('erases the photo and its check with the account (docs/30)', async () => {
    const db = testD1();
    const users = d1Users(db);
    await users.save(person(1, { status: 'pending', reason: null, at: 30 }));
    await users.erase(1, 40);
    const row = await db
      .prepare('SELECT avatar_key, avatar_status, avatar_at FROM users WHERE id = 1')
      .first();
    expect(row).toEqual({ avatar_key: null, avatar_status: null, avatar_at: null });
    expect(await users.pendingFaces()).toEqual([]);
  });

  it('claims the zone invite once, only for a registered person (docs/119)', async () => {
    const db = testD1();
    const users = d1Users(db);
    expect(await users.claimZoneInvite(1, 5)).toBe(false);
    await users.save(person(1, null));
    expect(await users.claimZoneInvite(1, 5)).toBe(true);
    expect(await users.claimZoneInvite(1, 6)).toBe(false);
    // A save of the profile keeps the claim.
    await users.save(person(1, { status: 'pending', reason: null, at: 7 }));
    expect(await users.claimZoneInvite(1, 8)).toBe(false);
    expect(fullScans(db)).toEqual([]);
  });
});
