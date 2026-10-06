import { describe, expect, it } from 'vitest';
import { canSeeAvatar } from './avatar-visibility';
import { toMyProfile, toPublicProfile } from './profiles';
import { activeBlock, normalizePhone, rolesOf, type User } from './user';

const NOW = 1_000_000;
const sampleUser: User = {
  id: 1,
  publicId: 'p1',
  firstName: 'Dilnoza',
  gender: 'female',
  phone: '+998901234567',
  locale: 'uz-Latn',
  isDriver: false,
  consentAt: NOW,
  block: null,
  avatarKey: 'avatars/1/a',
  writeAccess: true,
  createdAt: NOW,
  updatedAt: NOW,
};

describe('roles', () => {
  it('gives every person the passenger role, driver and admin only when earned', () => {
    expect(rolesOf(sampleUser, false)).toEqual(['passenger']);
    expect(rolesOf({ ...sampleUser, isDriver: true }, true)).toEqual(['passenger', 'driver', 'admin']);
  });
});

describe('activeBlock', () => {
  it('ends a temporary block by itself and keeps a permanent one', () => {
    expect(activeBlock([null, null], NOW)).toBeNull();
    expect(activeBlock([{ until: NOW - 1 }], NOW)).toBeNull();
    expect(activeBlock([{ until: NOW + 5 }, { until: NOW + 9 }], NOW)).toEqual({ until: NOW + 9 });
    expect(activeBlock([{ until: NOW + 5 }, { until: null }], NOW)).toEqual({ until: null });
  });
});

describe('normalizePhone', () => {
  it('keeps one form for every spelling', () => {
    expect(normalizePhone('998 (90) 123-45-67')).toBe('+998901234567');
    expect(normalizePhone('+998901234567')).toBe('+998901234567');
  });
});

describe('canSeeAvatar (docs/05)', () => {
  const stranger = { id: 2, isAdmin: false };

  it('shows a passenger photo to the owner, moderators and co passengers only', () => {
    expect(canSeeAvatar({ id: 1, isAdmin: false }, sampleUser, 'none')).toBe(true);
    expect(canSeeAvatar({ id: 3, isAdmin: true }, sampleUser, 'none')).toBe(true);
    expect(canSeeAvatar(stranger, sampleUser, 'co_passenger')).toBe(true);
    expect(canSeeAvatar(stranger, sampleUser, 'none')).toBe(false);
  });

  it('never shows a passenger photo to the driver of the trip', () => {
    expect(canSeeAvatar(stranger, sampleUser, 'trip_driver')).toBe(false);
  });

  it('shows a driver photo to everybody and hides a missing photo', () => {
    expect(canSeeAvatar(stranger, { ...sampleUser, isDriver: true }, 'none')).toBe(true);
    expect(canSeeAvatar({ id: 1, isAdmin: true }, { ...sampleUser, avatarKey: null }, 'none')).toBe(false);
  });
});

describe('profiles', () => {
  it('gives the phone only to the owner', () => {
    expect(toMyProfile(sampleUser, false)).toMatchObject({ phone: '+998901234567', rating: null });
    const shown = toPublicProfile(sampleUser);
    expect(shown).toEqual({ id: 'p1', firstName: 'Dilnoza', hasAvatar: true, rating: null });
    expect(JSON.stringify(shown)).not.toContain('998');
  });
});
