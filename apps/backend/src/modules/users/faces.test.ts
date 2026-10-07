import { describe, expect, it } from 'vitest';
import { setAvatar } from './application/avatar';
import { deleteAccount } from './application/delete-account';
import { decideFace, facePhoto, pendingFaces } from './application/faces';
import { getMe } from './application/get-me';
import { people } from './application/people';
import { getPublicProfile } from './application/profile';
import { register } from './application/register';
import { ali, input, jpeg, NOW, setup } from './test-kit';

const MODERATOR = 900;
const vali = { id: 2, firstName: 'Vali', isAdmin: false };
const valiInput = { ...input, firstName: 'Vali', contact: { userId: 2, phone: '998901234568' } };

describe('the face photo check (docs/118, G51)', () => {
  it('sends every new photo to the team and lets the owner see it waiting', async () => {
    const { deps, told } = setup();
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    expect(told).toEqual(['card:1']);
    const me = await getMe(deps, ali);
    expect(me.state === 'active' && me.profile).toMatchObject({
      hasAvatar: true,
      avatarStatus: 'pending',
      avatarReason: null,
    });
    const shown = await getPublicProfile(deps, 1);
    expect(shown.ok && shown.profile.hasAvatar).toBe(false);
    expect((await people(deps).find(1))?.avatarShown).toBe(false);
  });

  it('lists waiting photos the oldest first and gives the team the photo', async () => {
    const { deps } = setup();
    await register(deps, ali, input);
    await register(deps, vali, valiInput);
    await setAvatar({ ...deps, now: () => NOW + 5 }, ali, jpeg(12));
    await setAvatar(deps, vali, jpeg(10));
    expect(await pendingFaces(deps)).toEqual([
      { userId: 'id2', firstName: 'Vali', uploadedAt: NOW },
      { userId: 'id1', firstName: 'Ali', uploadedAt: NOW + 5 },
    ]);
    expect((await facePhoto(deps, 1))?.type).toBe('image/jpeg');
    expect(await facePhoto(deps, 5)).toBeUndefined();
  });

  it('approves once: then others see the photo, and no message goes to the person', async () => {
    const { deps, told } = setup();
    await register(deps, ali, input);
    expect(await decideFace(deps, MODERATOR, 1, { action: 'approve' })).toEqual({
      ok: false,
      error: 'users.not_found',
    });
    await setAvatar(deps, ali, jpeg(10));
    expect((await decideFace(deps, MODERATOR, 1, { action: 'approve' })).ok).toBe(true);
    expect(await decideFace(deps, MODERATOR, 1, { action: 'reject', reason: 'not_real_photo' })).toEqual({
      ok: false,
      error: 'users.face_decided',
    });
    expect(told).toEqual(['card:1', 'log:approved:null:900']);
    expect((await people(deps).find(1))?.avatarShown).toBe(true);
    expect(await pendingFaces(deps)).toEqual([]);
  });

  it('rejects with a reason: the person hears it and a new photo waits again', async () => {
    const { deps, told } = setup();
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    await decideFace(deps, MODERATOR, 1, { action: 'reject', reason: 'face_not_visible' });
    expect(told).toEqual(['card:1', 'log:rejected:face_not_visible:900', 'rejected:1:face_not_visible']);
    const me = await getMe(deps, ali);
    expect(me.state === 'active' && me.profile).toMatchObject({
      avatarStatus: 'rejected',
      avatarReason: 'face_not_visible',
    });
    await setAvatar(deps, ali, jpeg(10));
    const again = await getMe(deps, ali);
    expect(again.state === 'active' && again.profile.avatarStatus).toBe('pending');
  });

  it('approves the face of an approved driver application (docs/04)', async () => {
    const { deps } = setup();
    await register(deps, ali, input);
    await people(deps).approveFace(1);
    expect((await people(deps).find(1))?.avatarShown).toBe(false);
    await setAvatar(deps, ali, jpeg(10));
    await people(deps).approveFace(1);
    expect((await people(deps).find(1))?.avatarShown).toBe(true);
  });

  it('erases the photo and its check with the account (docs/30)', async () => {
    const { deps, avatars, users } = setup();
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    expect(avatars.keys()).toHaveLength(1);
    expect(await deleteAccount(deps, async () => ({ holdPhone: false }), ali)).toBe(true);
    expect(avatars.keys()).toEqual([]);
    expect(await users.find(1)).toBeUndefined();
    expect(await pendingFaces(deps)).toEqual([]);
  });

  it('claims the zone invite once per registered person (docs/119)', async () => {
    const { deps, users } = setup();
    expect(await users.claimZoneInvite(1, NOW)).toBe(false);
    await register(deps, ali, input);
    expect(await users.claimZoneInvite(1, NOW)).toBe(true);
    expect(await users.claimZoneInvite(1, NOW)).toBe(false);
  });
});
