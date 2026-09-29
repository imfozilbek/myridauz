import type { Offer } from '@platform/contracts';
import type { OfferRepository } from '../application/ports';
import type { OfferRecord } from '../domain/offer';

type Row = {
  id: string;
  request_id: string;
  driver_id: number;
  depart_at: number;
  price: number;
  status: Offer['status'];
  booking_id: string | null;
  created_at: number;
};

const toOffer = (row: Row): OfferRecord => ({
  id: row.id,
  requestId: row.request_id,
  driverId: row.driver_id,
  departAt: row.depart_at,
  price: row.price,
  status: row.status,
  bookingId: row.booking_id,
  createdAt: row.created_at,
});

const all = async (statement: D1PreparedStatement) => (await statement.all<Row>()).results.map(toOffer);

// Table offers (migrations/0008_bookings_wallet.sql).
export const d1Offers = (db: D1Database): OfferRepository => ({
  save: async (offer) => {
    await db
      .prepare(
        `INSERT INTO offers (id, request_id, driver_id, depart_at, price, status, booking_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET status = excluded.status, booking_id = excluded.booking_id`,
      )
      .bind(offer.id, offer.requestId, offer.driverId, offer.departAt, offer.price, offer.status,
        offer.bookingId, offer.createdAt)
      .run();
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM offers WHERE id = ?').bind(id).first<Row>();
    return row ? toOffer(row) : undefined;
  },
  byRequests: async (requestIds) =>
    requestIds.length === 0
      ? []
      : all(
          db
            .prepare(`SELECT * FROM offers WHERE request_id IN (${requestIds.map(() => '?').join(', ')})`)
            .bind(...requestIds),
        ),
  byDriver: async (driverId) => all(db.prepare('SELECT * FROM offers WHERE driver_id = ?').bind(driverId)),
});
