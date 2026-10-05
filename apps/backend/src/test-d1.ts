import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

// Test helper: D1 over SQLite of Node with every migration applied (G24). The SQL of a
// repository runs as in production: a wrong column or a broken statement fails the test.
const MIGRATIONS = import.meta.glob('../migrations/*.sql', { query: '?raw', import: 'default', eager: true });

type Value = SQLInputValue | boolean;
type Ran = { readonly sql: string; readonly values: SQLInputValue[] };
const plain = (values: readonly Value[]) =>
  values.map((value) => (typeof value === 'boolean' ? Number(value) : value));
// Every statement a test database ran, to read its query plan (G56, docs/117).
const ranOn = new WeakMap<D1Database, { db: DatabaseSync; ran: Ran[] }>();

export function testD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const name of Object.keys(MIGRATIONS).sort()) db.exec(MIGRATIONS[name] ?? '');
  const ran: Ran[] = [];
  const prepare = (sql: string) => {
    let values: SQLInputValue[] = [];
    const statement = {
      bind: (...next: Value[]) => {
        values = plain(next);
        return statement;
      },
      all: async () => {
        ran.push({ sql, values });
        return { results: db.prepare(sql).all(...values), success: true, meta: {} };
      },
      first: async () => {
        ran.push({ sql, values });
        return db.prepare(sql).get(...values) ?? null;
      },
      run: async () => {
        ran.push({ sql, values });
        return { success: true, meta: { changes: Number(db.prepare(sql).run(...values).changes) } };
      },
    };
    return statement;
  };
  const batch = async (statements: readonly { all: () => Promise<unknown> }[]) =>
    Promise.all(statements.map((statement) => statement.all()));
  const d1 = { prepare, batch, exec: async (sql: string) => db.exec(sql) } as unknown as D1Database;
  ranOn.set(d1, { db, ran });
  return d1;
}

// The tables that grow with every trip and person: reading one whole costs the free D1 quota
// (G56, docs/117). Small fixed tables (the places, the team, the settings) may be read whole.
const GROWING = [
  'trips',
  'bookings',
  'ride_requests',
  'offers',
  'wallet_operations',
  'route_subscriptions',
  'complaints',
  'users',
  'rating_asks',
  'ratings',
  'channel_posts',
  'support_messages',
  'driver_applications',
  'application_log',
  'user_arrivals',
] as const;
// «SCAN t» reads every row of t, through an index or not; «SEARCH t USING INDEX» reads only what it needs.
const SCAN = /^SCAN (\w+)/u;

// The statements that read a growing table whole, with the table: an empty list is the goal.
export function fullScans(d1: D1Database): string[] {
  const state = ranOn.get(d1);
  if (!state) return [];
  const found = new Set<string>();
  for (const { sql, values } of state.ran) {
    const plan = state.db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...values) as { detail: string }[];
    for (const { detail } of plan) {
      const table = SCAN.exec(detail)?.[1];
      if (table && (GROWING as readonly string[]).includes(table))
        found.add(`${table}: ${sql.replace(/\s+/gu, ' ').slice(0, 120)}`);
    }
  }
  return [...found];
}
