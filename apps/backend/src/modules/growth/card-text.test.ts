import { loadBrand } from '@platform/brands';
import { PHRASES, SHARE_MOMENTS } from '@platform/contracts';
import { toCyrillic } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { cardMessage } from './infrastructure/card-text';

const brand = loadBrand();
// The brand name stays as the brand config writes it (G98).
const cyrillic = (text: string) => toCyrillic(text, [brand.name]);

// The ready message of «Yoʻlovchilarimga yuborish» (docs/123, goals/g69/1-share-cards.png 4).
describe('the chat card of a moment', () => {
  it('speaks in the voice of the person: the phrase, the name, the fact, why the brand, one button', () => {
    const { text, words } = cardMessage(brand, { name: 'Jasur', moment: 'driver', phrase: 0 });
    expect(text).toBe(
      `${cyrillic(`«Men ${brand.name} haydovchisiman»`)}\nJasur\n` +
        cyrillic(
          `${brand.name} haydovchisi\n\n` +
            'Raqamingiz yashirin. Telegramda ochiladi. Ilova yuklab olish shart emas.\n' +
            `Siz ham ${brand.name} bilan yoʻlga chiqing:`,
        ),
    );
    // The link opens the passenger bot: the button says so (G88, docs/193).
    expect(words).toEqual({ title: cyrillic(`Men ${brand.name} bilan`), button: cyrillic('Safar topish') });
  });

  it('has the words of every phrase of every moment', () => {
    for (const moment of SHARE_MOMENTS)
      for (let phrase = 0; phrase < PHRASES; phrase += 1)
        expect(cardMessage(brand, { name: 'Jasur', moment, phrase }).text).not.toContain('{');
  });
});
