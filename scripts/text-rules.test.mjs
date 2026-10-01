import { describe, expect, it } from 'vitest';
import { findViolations, isTextFile } from './text-rules.mjs';

const EM = '\u2014';
const EN = '\u2013';
const BRANDS = ['acme'];

describe('findViolations', () => {
  it('finds long dashes anywhere', () => {
    expect(findViolations('docs/a.md', `one\ntwo ${EM} three`, BRANDS)).toEqual(['docs/a.md:2: long dash']);
    expect(findViolations('apps/x/src/a.ts', `a ${EN} b`, BRANDS)).toEqual(['apps/x/src/a.ts:1: long dash']);
  });

  it('allows a quoted dash that names the rule', () => {
    expect(findViolations('CLAUDE.md', `do not use \u00AB${EM}\u00BB`, BRANDS)).toEqual([]);
  });

  it('finds the brand name in apps and packages outside linted code', () => {
    expect(findViolations('apps/x/index.html', '<title>Acme</title>', BRANDS)).toEqual([
      'apps/x/index.html:1: brand name outside brands/',
    ]);
  });

  it('finds the brand as a word, not inside another word of the text (G27: «tashqarida»)', () => {
    expect(findViolations('packages/i18n/locales/x.json', '"a": "Acme bilan"', BRANDS)).toHaveLength(1);
    expect(findViolations('packages/i18n/locales/x.json', '"a": "acme.uz"', BRANDS)).toHaveLength(1);
    expect(findViolations('packages/i18n/locales/x.json', '"a": "tashqacmeda"', BRANDS)).toEqual([]);
  });

  it('leaves the brand name to ESLint in code and allows it in brands and docs', () => {
    expect(findViolations('packages/x/src/a.ts', 'acme', BRANDS)).toEqual([]);
    expect(findViolations('brands/acme/x.json', 'Acme', BRANDS)).toEqual([]);
    expect(findViolations('docs/a.md', 'Acme', BRANDS)).toEqual([]);
  });
});

describe('isTextFile', () => {
  it('accepts text files and skips binary files', () => {
    expect(isTextFile('docs/a.md')).toBe(true);
    expect(isTextFile('.gitignore')).toBe(true);
    expect(isTextFile('fonts/a.ttf')).toBe(false);
  });
});

describe('encoded data (G24)', () => {
  it('does not read the letters of encoded borders as a brand name', () => {
    expect(findViolations('apps/backend/seed/district-borders.json', '{"x":"abcacmexyz"}', ['acme'])).toEqual(
      [],
    );
    expect(findViolations('apps/backend/seed/locations.json', '{"x":"acme"}', ['acme'])).toHaveLength(1);
  });
});
