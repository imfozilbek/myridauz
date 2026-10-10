import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Limits } from './infrastructure/d1-limits';

const NOW = Date.parse('2026-10-12T05:00:00Z');

// «Cheklovlar» on SQLite with the real migrations (G75, migration 0058).
describe('the limits of the owner in D1', () => {
  it('keeps the last value of a limit and every change, never scans the history', async () => {
    const db = testD1();
    const limits = d1Limits(db);
    await limits.change({ key: 'promo.grants', before: 3, after: 2, by: 900, at: NOW });
    await limits.change({ key: 'promo.grants', before: 2, after: 4, by: 900, at: NOW + 1 });
    await db.exec(
      `INSERT INTO limit_values (key, value, changed_by, changed_at) VALUES ('gone.key', 1, 900, 0)`,
    );
    expect(await limits.values()).toEqual({ 'promo.grants': 4 });
    expect((await limits.history(1)).map((change) => change.after)).toEqual([4]);
    expect(fullScans(db).filter((scan) => scan.includes('limit_history'))).toEqual([]);
  });
});
