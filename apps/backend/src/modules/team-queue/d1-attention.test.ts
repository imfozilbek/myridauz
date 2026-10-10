import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Signs } from './infrastructure/d1-attention';

const DAY = Date.parse('2026-10-12T05:00:00Z');
const WEEK = 7 * 24 * 60 * 60 * 1000;
const errors = (hour: number) => ({ kind: 'errors' as const, hour, usual: 1 });

// «Diqqat» on SQLite with the real migrations (G75, migration 0055).
describe('the signs of «Diqqat» in D1', () => {
  it('keeps a sign a day by its id, newest first, forgets a week ago, never scans the table', async () => {
    const db = testD1();
    const signs = d1Signs(db);
    await signs.keep('2026-10-05', { id: 'errors', at: DAY - WEEK, sign: errors(5) });
    await signs.keep('2026-10-12', { id: 'errors', at: DAY, sign: errors(7) });
    await signs.keep('2026-10-12', { id: 'drop:way:to', at: DAY + 1, sign: errors(1) });
    await signs.keep('2026-10-12', { id: 'errors', at: DAY + 2, sign: errors(9) });
    expect(await signs.ofDay('2026-10-12')).toEqual([
      { id: 'errors', at: DAY + 2, sign: errors(9) },
      { id: 'drop:way:to', at: DAY + 1, sign: errors(1) },
    ]);
    await signs.keep('2026-10-13', { id: 'errors', at: DAY + WEEK, sign: errors(2) });
    expect(await signs.ofDay('2026-10-05')).toEqual([]);
    await db.exec(
      `INSERT INTO attention_signs (day, id, sign, at) VALUES ('2026-10-13', 'old', '{"kind":"gone"}', 1)`,
    );
    expect((await signs.ofDay('2026-10-13')).map((kept) => kept.id)).toEqual(['errors']);
    expect(fullScans(db)).toEqual([]);
  });
});
