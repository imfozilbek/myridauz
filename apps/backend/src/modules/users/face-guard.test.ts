import { describe, expect, it } from 'vitest';
import { setAvatar } from './application/avatar';
import { decideFace } from './application/faces';
import { register } from './application/register';
import { ali, input, jpeg, NOW, setup } from './test-kit';

const DECIDED = { ok: false, error: 'users.face_decided' };

// G89 A8, M8: a face photo is decided once, and only the photo the moderator saw.
describe('a decision on a face photo', () => {
  it('two at the same moment: one wins, one message to the person', async () => {
    const { deps, told } = setup();
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    const taps = await Promise.all([
      decideFace(deps, 900, 1, { action: 'reject', reason: 'face_not_visible' }),
      decideFace(deps, 901, 1, { action: 'reject', reason: 'not_one_person' }),
    ]);
    expect(taps.filter((tap) => tap.ok)).toHaveLength(1);
    expect(told.filter((line) => line.startsWith('rejected'))).toHaveLength(1);
  });

  it('refuses a decision on an older photo when the person put a new one', async () => {
    const { deps } = setup();
    await register(deps, ali, input);
    await setAvatar(deps, ali, jpeg(10));
    await setAvatar({ ...deps, now: () => NOW + 5 }, ali, jpeg(11));
    expect(await decideFace(deps, 900, 1, { action: 'approve', at: NOW })).toEqual(DECIDED);
    expect((await decideFace(deps, 900, 1, { action: 'approve', at: NOW + 5 })).ok).toBe(true);
  });
});
