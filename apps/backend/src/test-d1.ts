import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

// Test helper: D1 over SQLite of Node with every migration applied (G24). The SQL of a
// repository runs as in production: a wrong column or a broken statement fails the test.
const MIGRATIONS = import.meta.glob('../migrations/*.sql', { query: '?raw', import: 'default', eager: true });

type Value = SQLInputValue | boolean;
const plain = (values: readonly Value[]) =>
  values.map((value) => (typeof value === 'boolean' ? Number(value) : value));

export function testD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const name of Object.keys(MIGRATIONS).sort()) db.exec(MIGRATIONS[name] ?? '');
  const prepare = (sql: string) => {
    let values: SQLInputValue[] = [];
    const statement = {
      bind: (...next: Value[]) => {
        values = plain(next);
        return statement;
      },
      all: async () => ({ results: db.prepare(sql).all(...values), success: true, meta: {} }),
      first: async () => db.prepare(sql).get(...values) ?? null,
      run: async () => ({ success: true, meta: { changes: Number(db.prepare(sql).run(...values).changes) } }),
    };
    return statement;
  };
  const batch = async (statements: readonly { all: () => Promise<unknown> }[]) =>
    Promise.all(statements.map((statement) => statement.all()));
  return { prepare, batch, exec: async (sql: string) => db.exec(sql) } as unknown as D1Database;
}
