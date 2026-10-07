import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Texts follow the rule of code: at most 150 lines in a file (docs/11). ESLint reads no JSON.
const MAX_LINES = 150;
const LOCALES = new URL('../packages/i18n/locales/', import.meta.url);

describe('locale files', () => {
  it('keep every file within 150 lines (G44)', () => {
    const long = readdirSync(LOCALES, { recursive: true, encoding: 'utf8' })
      .filter((name) => name.endsWith('.json'))
      .filter(
        (name) => readFileSync(new URL(name, LOCALES), 'utf8').trimEnd().split('\n').length > MAX_LINES,
      );
    expect(long).toEqual([]);
  });
});
