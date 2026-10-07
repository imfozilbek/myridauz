import { describe, expect, it } from 'vitest';
import { canSeeAvatar } from './avatar-visibility';
import { approvedFace, judgeFace, newFace } from './face';
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
  face: { status: 'approved', reason: null, at: NOW },
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

  it('shows a photo the team did not approve only to its owner and the team (docs/118)', () => {
    for (const face of [newFace(NOW), { status: 'rejected', reason: 'not_real_photo', at: NOW } as const]) {
      const waiting = { ...sampleUser, isDriver: true, face };
      expect(canSeeAvatar({ id: 1, isAdmin: false }, waiting, 'none')).toBe(true);
      expect(canSeeAvatar({ id: 3, isAdmin: true }, waiting, 'none')).toBe(true);
      expect(canSeeAvatar(stranger, waiting, 'co_passenger')).toBe(false);
      expect(toPublicProfile(waiting).hasAvatar).toBe(false);
    }
  });
});

describe('the face check (G51)', () => {
  it('decides a waiting photo once, a rejected one with its reason', () => {
    const waiting = newFace(NOW);
    expect(waiting).toEqual({ status: 'pending', reason: null, at: NOW });
    const rejected = judgeFace(waiting, { action: 'reject', reason: 'face_not_visible' });
    expect(rejected).toEqual({ status: 'rejected', reason: 'face_not_visible', at: NOW });
    expect(judgeFace(waiting, { action: 'approve' })).toEqual({ status: 'approved', reason: null, at: NOW });
    if (typeof rejected === 'string') throw new Error(rejected);
    expect(judgeFace(rejected, { action: 'approve' })).toBe('users.face_decided');
    expect(approvedFace(rejected)).toEqual({ status: 'approved', reason: null, at: NOW });
  });
});

describe('profiles', () => {
  it('gives the phone only to the owner', () => {
    expect(toMyProfile(sampleUser, false)).toMatchObject({ phone: '+998901234567', rating: null });
    const waiting = {
      ...sampleUser,
      face: { status: 'rejected', reason: 'not_one_person', at: NOW } as const,
    };
    expect(toMyProfile(waiting, false)).toMatchObject({
      hasAvatar: true,
      avatarStatus: 'rejected',
      avatarReason: 'not_one_person',
    });
    expect(toMyProfile({ ...sampleUser, avatarKey: null, face: null }, false)).toMatchObject({
      hasAvatar: false,
      avatarStatus: null,
      avatarReason: null,
    });
    const shown = toPublicProfile(sampleUser);
    expect(shown).toEqual({ id: 'p1', firstName: 'Dilnoza', hasAvatar: true, rating: null });
    expect(JSON.stringify(shown)).not.toContain('998');
  });
});
