import type { PricingVersion } from '@platform/contracts';
import type { PricingRepository } from '../application/ports';

type VersionRow = {
  version: number;
  rate_per_km: number;
  round_step: number;
  min_price: number;
  max_price: number;
  changed_by: number | null;
  changed_at: number;
};

const toVersion = (row: VersionRow): PricingVersion => ({
  version: row.version,
  variables: {
    ratePerKm: row.rate_per_km,
    roundStep: row.round_step,
    minPrice: row.min_price,
    maxPrice: row.max_price,
  },
  changedBy: row.changed_by,
  changedAt: row.changed_at,
});

// Tables pricing_versions and direction_prices (migrations/0006_pricing.sql).
export const d1Pricing = (db: D1Database): PricingRepository => ({
  versions: async () =>
    (await db.prepare('SELECT * FROM pricing_versions ORDER BY version DESC').all<VersionRow>()).results.map(
      toVersion,
    ),
  addVersion: async (variables, changedBy, at) => {
    await db
      .prepare(
        `INSERT INTO pricing_versions (rate_per_km, round_step, min_price, max_price, changed_by, changed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(variables.ratePerKm, variables.roundStep, variables.minPrice, variables.maxPrice, changedBy, at)
      .run();
  },
  manualPrice: async (from, to) => {
    const row = await db
      .prepare('SELECT price FROM direction_prices WHERE from_id = ? AND to_id = ?')
      .bind(from, to)
      .first<{ price: number }>();
    return row?.price;
  },
  manualPrices: async () =>
    (
      await db
        .prepare('SELECT from_id, to_id, price FROM direction_prices ORDER BY changed_at DESC')
        .all<{ from_id: string; to_id: string; price: number }>()
    ).results.map((row) => ({ from: row.from_id, to: row.to_id, price: row.price })),
  setManualPrice: async (from, to, price, changedBy, at) => {
    if (price === null) {
      await db.prepare('DELETE FROM direction_prices WHERE from_id = ? AND to_id = ?').bind(from, to).run();
      return;
    }
    await db
      .prepare(
        `INSERT INTO direction_prices (from_id, to_id, price, changed_by, changed_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (from_id, to_id) DO UPDATE SET price = excluded.price,
         changed_by = excluded.changed_by, changed_at = excluded.changed_at`,
      )
      .bind(from, to, price, changedBy, at)
      .run();
  },
});
