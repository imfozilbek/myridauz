import { describe, expect, it } from 'vitest';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { getMe } from './application/get-me';
import { people } from './application/people';
import type { UsersDeps } from './application/ports';
import { setNews } from './application/profile';
import { register } from './application/register';
import { createMemoryUsers } from './infrastructure/memory-stores';

const ali = { id: 1, firstName: 'Ali', isAdmin: false };
const input = { firstName: 'Ali', gender: 'male' as const, contact: { userId: 1, phone: '998901234567' } };
const settings = { passengerAvatarRequired: false };

describe('«Bot xabarlari» (docs/88 L1)', () => {
  it('turns the news of the bot off and on; booking messages are not news', async () => {
    const deps: UsersDeps = {
      users: createMemoryUsers(),
      avatars: createMemoryImages(),
      trips: { relation: async () => 'none' },
      now: () => 0,
      newId: () => 'id1',
    };
    expect(await setNews(deps, ali, false)).toEqual({ ok: false, error: 'users.not_registered' });
    await register(deps, ali, input);
    const town = people(deps);
    expect(await town.wantsNews(1)).toBe(true);
    expect(await setNews(deps, ali, false)).toEqual({ ok: true });
    expect(await town.wantsNews(1)).toBe(false);
    const me = await getMe(deps, ali, settings);
    expect(me.state === 'active' && me.profile.news).toBe(false);
    await setNews(deps, ali, true);
    expect(await town.wantsNews(1)).toBe(true);
    expect(await town.wantsNews(99)).toBe(false);
  });
});
