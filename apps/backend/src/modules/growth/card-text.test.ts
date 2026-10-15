import { loadBrand } from '@platform/brands';
import { PHRASES, SHARE_MOMENTS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { cardMessage } from './infrastructure/card-text';

const brand = loadBrand();
const route = { from: 'Toshkent', to: 'Urgut' };
const input = {
  name: 'Jasur',
  route,
  people: 100,
  joinLink: 'https://t.me/brand_bot?startapp=__share-riders-a1b2c3',
};

// The ready message of «Doʻstlarimga yuborish» (docs/123, goals/g69/1-share-cards.png 4).
describe('the chat card of a moment', () => {
  it('speaks in the voice of the person: the phrase, the name and the route, the facts', () => {
    const { text, words } = cardMessage(brand, { ...input, moment: 'riders100', phrase: 0 });
    expect(text).toBe(
      '«100 kishini manziliga yetkazdim!»\nJasur · Toshkent → Urgut\n100 yoʻlovchi\n\nSiz ham Jasur bilan yoʻlga chiqing:',
    );
    expect(words).toEqual({
      title: `Men ${brand.name} bilan`,
      button: 'Jasurning safarlari',
      second: { text: `📲 ${brand.name} ga qoʻshilish`, url: input.joinLink },
    });
  });

  it('gives a passenger one button and the name alone without a trip', () => {
    const { text, words } = cardMessage(brand, { ...input, route: null, moment: 'join', phrase: 1 });
    expect(text.split('\n').slice(0, 3)).toEqual([
      '«Viloyatga endi birga boraman»',
      'Jasur',
      'Birga borish, xarajatni boʻlish',
    ]);
    expect(words).toEqual({ title: `Men ${brand.name} bilan`, button: 'Men ham qoʻshilaman' });
  });

  it('has the words of every phrase of every moment', () => {
    for (const moment of SHARE_MOMENTS)
      for (let phrase = 0; phrase < PHRASES; phrase += 1)
        expect(cardMessage(brand, { ...input, moment, phrase }).text).not.toContain('{');
  });
});
