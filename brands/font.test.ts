import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fontSigns } from './font-test-kit';
import { fontHead, fontStack, loadBrand } from './index';

// G73 (owner decision 07.10.2026): every screen in the font of the brand, named once in its theme.
const brand = loadBrand();
const folder = new URL(`./${brand.id}/public/fonts/${brand.theme.font}/`, import.meta.url);
const file = (name: string) => new URL(name, folder).pathname;
const LOCALES = new URL('../packages/i18n/locales/uz-Latn/', import.meta.url);
// Pictures stay with the emoji of the phone; the joiner and the selector only glue them.
const PICTURE = /\p{Extended_Pictographic}|\u200d|\ufe0f/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const codes = (text: string) => [...new Set(text)].map((sign) => sign.codePointAt(0) ?? 0);
const missing = (files: readonly string[], signs: readonly number[]) =>
  files.flatMap((name) => {
    const drawn = fontSigns(file(`${name}.woff2`));
    return signs.filter((code) => !drawn.has(code)).map((code) => `${name}: ${String.fromCodePoint(code)}`);
  });

// Every sign of every text of the product (the Uzbek texts of docs/25).
const texts = readdirSync(LOCALES)
  .map((name) => readFileSync(new URL(name, LOCALES), 'utf8'))
  .join('');
const signs = [...new Set(texts)].filter((sign) => sign >= ' ' && !PICTURE.test(sign));

describe('the font of the brand (G73)', () => {
  it('is named once in the theme and stands before the font of the phone', () => {
    expect(brand.theme.font).toBe('dejavu-sans');
    expect(fontStack('dejavu-sans')).toMatch(/^"dejavu-sans",system-ui,.+,sans-serif$/);
  });

  it('draws the Uzbek Latin of docs/25 in both weights: oʻ, gʻ, ʼ, «», soʻm', () => {
    expect(missing(['regular-latin', 'bold-latin'], codes('oʻgʻ Oʻ Gʻ taʼlim «soʻm» 1 000'))).toEqual([]);
  });

  it('draws every sign of the texts of the product, Cyrillic in its own files', () => {
    const latin = signs.filter((sign) => !CYRILLIC.test(sign)).join('');
    const cyrillic = `${signs.filter((sign) => CYRILLIC.test(sign)).join('')}сўмқғҳ`;
    expect(missing(['regular-latin', 'bold-latin'], codes(latin))).toEqual([]);
    expect(missing(['regular-cyrillic', 'bold-cyrillic'], codes(cyrillic))).toEqual([]);
  });

  it('leaves the pictures to the emoji of the phone', () => {
    expect(missing(['regular-latin'], codes('⭐✅❌⚠'))).toHaveLength(4);
  });

  it('comes with its license and faces that wait for it, not flash the font of the phone', () => {
    const license = readFileSync(file('LICENSE.txt'), 'utf8');
    expect(license).toContain('DejaVu changes are in public domain');
    expect(license).toContain('Bitstream Vera Fonts Copyright');
    const faces = readFileSync(file('font.css'), 'utf8');
    expect(faces.match(/@font-face/g)).toHaveLength(4);
    expect(faces.match(/font-family:"dejavu-sans"/g)).toHaveLength(4);
    expect(faces.match(/font-display:block/g)).toHaveLength(4);
  });

  it('puts the faces into the head and asks for the Latin files at once', () => {
    const head = fontHead('dejavu-sans', '@font-face{}');
    expect(head).toContain('<link rel="preload" href="/fonts/dejavu-sans/regular-latin.woff2" as="font"');
    expect(head).toContain('href="/fonts/dejavu-sans/bold-latin.woff2"');
    expect(head).toContain('<style>@font-face{}</style>');
  });
});
