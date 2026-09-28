import { describe, expect, it } from 'vitest';
import { createMemoryAvatars, createMemoryUsers } from './infrastructure/memory-stores';
import { readAvatar, setAvatar } from './application/avatar';
import { checkAccess } from './application/check-access';
import { getMe } from './application/get-me';
import type { TripRelations, UsersDeps } from './application/ports';
import { getPublicProfile, setWriteAccess } from './application/profile';
import { register } from './application/register';

const NOW = 1_000_000;
const settings = { passengerAvatarRequired: false };
const ali = { id: 1, firstName: 'Ali', isAdmin: false };
const input = { firstName: 'Ali', gender: 'male' as const, contact: { userId: 1, phone: '998901234567' } };
const jpeg = (size: number) => ({ body: new ArrayBuffer(size), type: 'image/jpeg' });

function setup(relation: Awaited<ReturnType<TripRelations['relation']>> = 'none') {
  const users = createMemoryUsers();
  const avatars = createMemoryAvatars();
  let id = 0;
  const deps: UsersDeps = {
    users,
    avatars,
    trips: { relation: async () => relation },
    now: () => NOW,
    newId: () => `id${(id += 1)}`,
  };
  const stored = async (userId: number) => {
    const user = await users.find(userId);
    if (!user) throw new Error('test.user_missing');
    return user;
  };
  return { deps, users, avatars, stored };
}

describe('registration', () => {
  it('registers once with the own Telegram phone', async () => {
    const { deps } = setup();
    expect(await getMe(deps, ali, settings)).toEqual({
      state: 'unregistered',
      suggestedName: 'Ali',
      settings,
    });
    const result = await register(deps, ali, input);
    expect(result.ok && result.user).toMatchObject({
      phone: '+998901234567',
      consentAt: NOW,
      isDriver: false,
    });
    expect(await register(deps, ali, input)).toEqual({ ok: false, error: 'users.already_registered' });
    const me = await getMe(deps, { ...ali, isAdmin: true }, settings);
    expect(me.state === 'active' && me.profile.roles).toEqual(['passenger', 'admin']);
  });

  it('refuses a phone of another person and a blocked phone', async () => {
    const { deps, users } = setup();
    const foreign = { ...input, contact: { userId: 2, phone: '998900000000' } };
    expect(await register(deps, ali, foreign)).toEqual({ ok: false, error: 'users.invalid_contact' });
    users.blockPhone('+998901234567', { until: null });
    expect(await register(deps, ali, input)).toEqual({ ok: false, error: 'users.blocked' });
  });
});

describe('blocking (docs/17)', () => {
  it('blocks by id and by phone, and a temporary block ends', async () => {
    const { deps, users, stored } = setup();
    await register(deps, ali, input);
    expect(await checkAccess(deps, 1)).toBeNull();
    const user = await stored(1);
    await users.save({ ...user, block: { until: NOW + 10 } });
    expect(await getMe(deps, ali, settings)).toEqual({ state: 'blocked', until: NOW + 10 });
    await users.save({ ...user, block: { until: NOW - 10 } });
    expect(await checkAccess(deps, 1)).toBeNull();
    users.blockPhone('+998901234567', { until: null });
    expect(await checkAccess(deps, 1)).toEqual({ until: null });
    expect(await checkAccess(deps, 99)).toBeNull();
  });
});

describe('avatar', () => {
  it('stores the photo privately, replaces the old one and checks size and type', async () => {
    const { deps, avatars } = setup();
    expect(await setAvatar(deps, ali, jpeg(10))).toEqual({ ok: false, error: 'users.not_registered' });
    await register(deps, ali, input);
    expect(await setAvatar(deps, ali, jpeg(10))).toEqual({ ok: true });
    expect(await setAvatar(deps, ali, jpeg(10))).toEqual({ ok: true });
    expect(avatars.keys()).toEqual(['avatars/1/id2']);
    expect(await setAvatar(deps, ali, jpeg(400 * 1024))).toEqual({
      ok: false,
      error: 'users.avatar_too_large',
    });
    expect(await setAvatar(deps, ali, { body: new ArrayBuffer(5), type: 'image/gif' })).toEqual({
      ok: false,
      error: 'users.invalid_input',
    });
  });

  it('never gives a passenger photo to the driver of the trip', async () => {
    const { deps } = setup('trip_driver');
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    const driver = { id: 2, firstName: 'Bek', isAdmin: false };
    expect(await readAvatar(deps, driver, 1)).toEqual({ ok: false, error: 'users.avatar_hidden' });
    expect((await readAvatar(deps, ali, 1)).ok).toBe(true);
    expect(await readAvatar(deps, driver, 5)).toEqual({ ok: false, error: 'users.not_found' });
  });

  it('gives the photo to a co passenger and answers not found when the file is gone', async () => {
    const { deps, avatars } = setup('co_passenger');
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    const other = { id: 3, firstName: 'Vali', isAdmin: false };
    expect((await readAvatar(deps, other, 1)).ok).toBe(true);
    for (const key of avatars.keys()) await avatars.delete(key);
    expect(await readAvatar(deps, other, 1)).toEqual({ ok: false, error: 'users.not_found' });
  });
});

describe('profile and write access', () => {
  it('shows no phone to others and records write access', async () => {
    const { deps, users } = setup();
    expect(await getPublicProfile(deps, 1)).toEqual({ ok: false, error: 'users.not_found' });
    expect(await setWriteAccess(deps, ali, true)).toEqual({ ok: false, error: 'users.not_registered' });
    await register(deps, ali, input);
    const shown = await getPublicProfile(deps, 1);
    expect(shown.ok && shown.profile).toEqual({ id: 1, firstName: 'Ali', hasAvatar: false, rating: null });
    expect(await setWriteAccess(deps, ali, true)).toEqual({ ok: true });
    expect((await users.find(1))?.writeAccess).toBe(true);
    expect(await setWriteAccess(deps, ali, true)).toEqual({ ok: true });
  });
});
