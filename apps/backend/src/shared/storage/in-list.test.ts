import { describe, expect, it } from 'vitest';
import { allIn, IN_LIST_LIMIT } from './in-list';

// A fake D1: every statement answers its own bound ids as rows.
function fakeDb() {
  const bound: unknown[][] = [];
  const db = {
    prepare: (sql: string) => ({
      bind: (...values: unknown[]) => {
        bound.push(values);
        return { sql, values };
      },
    }),
    batch: async (statements: { values: unknown[] }[]) =>
      statements.map((statement) => ({ results: statement.values.slice(1).map((id) => ({ id })) })),
  };
  return { db: db as unknown as D1Database, bound };
}

describe('a list of ids in a query (docs/65 A2)', () => {
  it('sends 250 ids in parts of at most 90 with the leading values, and returns every row once', async () => {
    const { db, bound } = fakeDb();
    const ids = Array.from({ length: 250 }, (_, index) => `id-${index}`);
    const rows = await allIn<{ id: string }>(
      db,
      (marks) => `WHERE a >= ? AND id IN (${marks})`,
      [...ids, 'id-0'],
      [7],
    );
    expect(bound.map((values) => values.length - 1)).toEqual([90, 90, 70]);
    expect(bound.every((values) => values[0] === 7 && values.length - 1 <= IN_LIST_LIMIT)).toBe(true);
    expect(rows.map((row) => row.id)).toEqual(ids);
    expect(await allIn(db, () => 'unused', [])).toEqual([]);
  });
});
