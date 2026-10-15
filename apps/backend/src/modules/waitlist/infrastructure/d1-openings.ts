import type { Opening } from '@platform/contracts';
import type { OpeningStore, SwitchStore } from '../application/ports';

type OpeningRow = { readonly region: string; readonly opened_at: number; readonly sent: number };
const toOpening = (row: OpeningRow): Opening => ({ at: row.opened_at, sent: row.sent });
// The switch «Roʻyxatga yozish» (docs/181): on while no row says otherwise.
const LIST_SWITCH = 'waitlist';

// The opened directions and the switch of the list in D1 (migration 0066): small tables.
export function d1Openings(db: D1Database): OpeningStore {
  return {
    of: async (region) => {
      const row = await db
        .prepare('SELECT region, opened_at, sent FROM waitlist_openings WHERE region = ?')
        .bind(region)
        .first<OpeningRow>();
      return row ? toOpening(row) : null;
    },
    all: async () => {
      const { results } = await db
        .prepare('SELECT region, opened_at, sent FROM waitlist_openings')
        .all<OpeningRow>();
      return new Map(results.map((row) => [row.region, toOpening(row)]));
    },
    open: async (region, by, sent, now) => {
      await db
        .prepare(
          'INSERT INTO waitlist_openings (region, opened_by, opened_at, sent) VALUES (?, ?, ?, ?) ' +
            'ON CONFLICT (region) DO NOTHING',
        )
        .bind(region, by, now, sent)
        .run();
    },
  };
}

export function d1Switches(db: D1Database): SwitchStore {
  return {
    read: async () => {
      const row = await db
        .prepare('SELECT value, changed_at FROM switches WHERE key = ?')
        .bind(LIST_SWITCH)
        .first<{ value: number; changed_at: number }>();
      return row ? { open: row.value === 1, at: row.changed_at } : { open: true, at: null };
    },
    set: async (open, by, now) => {
      await db
        .prepare(
          'INSERT INTO switches (key, value, changed_by, changed_at) VALUES (?, ?, ?, ?) ON CONFLICT (key) ' +
            'DO UPDATE SET value = excluded.value, changed_by = excluded.changed_by, changed_at = excluded.changed_at',
        )
        .bind(LIST_SWITCH, open ? 1 : 0, by, now)
        .run();
    },
  };
}
