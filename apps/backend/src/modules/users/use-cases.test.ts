import { describe, expect, it } from 'vitest';
import { readAvatar, setAvatar } from './application/avatar';
import { checkAccess } from './application/check-access';
import { decideFace } from './application/faces';
import { getMe } from './application/get-me';
import { getPublicProfile, setWriteAccess } from './application/profile';
import { register } from './application/register';
import { ali, input, jpeg, NOW, setup } from './test-kit';

describe('registration', () => {
  it('registers once with the own Telegram phone', async () => {
    const { deps } = setup();
    expect(await getMe(deps, ali)).toEqual({
      state: 'unregistered',
      suggestedName: 'Ali',
    });
    const result = await register(deps, ali, input);
    expect(result.ok && result.user).toMatchObject({
      phone: '+998901234567',
      consentAt: NOW,
      isDriver: false,
    });
    expect(await register(deps, ali, input)).toEqual({ ok: false, error: 'users.already_registered' });
    const me = await getMe(deps, { ...ali, isAdmin: true });
    expect(me.state === 'active' && me.profile.roles).toEqual(['passenger', 'admin']);
  });

  it('refuses a phone of another person and a blocked phone', async () => {
    const { deps, users } = setup();
    const foreign = { ...input, contact: { userId: 2, phone: '998900000000' } };
    expect(await register(deps, ali, foreign)).toEqual({ ok: false, error: 'users.invalid_contact' });
    await users.blockPhone('+998901234567', { until: null }, 0);
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
    expect(await getMe(deps, ali)).toEqual({ state: 'blocked', until: NOW + 10 });
    await users.save({ ...user, block: { until: NOW - 10 } });
    expect(await checkAccess(deps, 1)).toBeNull();
    await users.blockPhone('+998901234567', { until: null }, 0);
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
    expect(avatars.keys()).toEqual(['avatars/1/id3']);
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
    // Until the team approves the photo, others see a person without a photo (docs/118).
    expect(await readAvatar(deps, other, 1)).toEqual({ ok: false, error: 'users.avatar_hidden' });
    await decideFace(deps, 900, 1, { action: 'approve' });
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
    expect(shown.ok && shown.profile).toEqual({
      id: 'id1',
      firstName: 'Ali',
      hasAvatar: false,
      rating: null,
    });
    expect(await setWriteAccess(deps, ali, true)).toEqual({ ok: true });
    expect((await users.find(1))?.writeAccess).toBe(true);
    expect(await setWriteAccess(deps, ali, true)).toEqual({ ok: true });
  });
});
