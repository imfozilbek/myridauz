import { API_ERRORS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';

// Every source file of the backend as text, as test-d1.ts reads the migrations.
const SOURCES: Record<string, string> = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});
const ANSWERED = /error:\s*'([a-z_]+\.[a-z_]+)'/gu;

// G89 U11: every code a route answers is in the contract, or the screens lose it and show the
// general text (docs/13).
describe('the error codes of the API', () => {
  it('are all in the contract', () => {
    const answered = Object.values(SOURCES).flatMap((text) =>
      [...text.matchAll(ANSWERED)].map((match) => match[1] ?? ''),
    );
    const known: readonly string[] = API_ERRORS;
    expect(answered.length).toBeGreaterThan(50);
    expect([...new Set(answered.filter((code) => !known.includes(code)))]).toEqual([]);
  });
});
