import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { supportButtons } from './support-card';

const brand = loadBrand();
const asker = { name: 'Ali', role: 'passenger' as const, publicId: 'a'.repeat(32), places: new Map() };
const texts = (owner: boolean) =>
  supportButtons(brand, asker, false, owner)
    .inline_keyboard.flat()
    .map((button) => button.text);

// Q8 of docs/111 (G45): «Profilni ochish» opens «Odamlar», which is the owner's; a moderator's copy
// has no button that would end on «ruxsat yoʻq».
describe('the buttons of a support question', () => {
  it('give «Profilni ochish» to an owner only', () => {
    expect(texts(true)).toEqual(['✍️ Javob berish', '👤 Profilni ochish']);
    expect(texts(false)).toEqual(['✍️ Javob berish']);
  });
});
