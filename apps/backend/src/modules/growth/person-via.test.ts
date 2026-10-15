import { describe, expect, it } from 'vitest';
import type { Bindings } from '../../env';
import { testD1 } from '../../test-d1';
import { cardWords } from '../shares/infrastructure/share-texts';
import { personVia } from '.';

// The loops outside the cards (G69, docs/123): «Yaqinlarimga», the free seats, the group, the QR.
describe('the mark of a link a person shares', () => {
  it('carries the loop and the same code of the person, and nothing without D1', async () => {
    const env = { DB: testD1() } as Bindings;
    const follow = await personVia(env, 5, 'follow');
    expect(follow).toMatch(/^follow-[a-z0-9]{6}$/u);
    expect(await personVia(env, 5, 'seats')).toBe(follow?.replace('follow', 'seats'));
    expect(await personVia({} as Bindings, 5, 'follow')).toBeNull();
  });

  it('puts «Men ham yoʻlga chiqaman» under the card for close people only with the mark', () => {
    expect(cardWords('brand_bot', 'follow-a1b2c3').second).toEqual({
      text: 'Men ham yoʻlga chiqaman',
      url: 'https://t.me/brand_bot?startapp=__follow-a1b2c3',
    });
    expect(cardWords('brand_bot', null)).not.toHaveProperty('second');
  });
});
