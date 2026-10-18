import { loadBrand } from '@platform/brands';
import { PHRASES, SHARE_MOMENTS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { cardMessage } from './infrastructure/card-text';

const brand = loadBrand();

// The ready message of «Doʻstlarimga yuborish» (docs/123, goals/g69/1-share-cards.png 4).
describe('the chat card of a moment', () => {
  it('speaks in the voice of the person: the phrase, the name, the fact, why the brand, one button', () => {
    const { text, words } = cardMessage(brand, { name: 'Jasur', moment: 'driver', phrase: 0 });
    expect(text).toBe(
      `«Men ${brand.name} haydovchisiman»\nJasur\n${brand.name} haydovchisi\n\n` +
        'Raqamingiz yashirin. Telegramda ochiladi. Ilova yuklab olish shart emas.\n' +
        'Siz ham Jasur bilan yoʻlga chiqing:',
    );
    // The link opens the passenger bot: the button says so (G88, docs/193).
    expect(words).toEqual({ title: `Men ${brand.name} bilan`, button: 'Safar topish' });
  });

  it('gives a new passenger the words of the registration', () => {
    const { text, words } = cardMessage(brand, { name: 'Jasur', moment: 'join', phrase: 1 });
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
        expect(cardMessage(brand, { name: 'Jasur', moment, phrase }).text).not.toContain('{');
  });
});
