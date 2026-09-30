import { CAR_COLORS, type Offer } from '@platform/contracts';
import type { OfferRepository } from '../application/ports';
import type { OfferCar, OfferRecord } from '../domain/offer';
import { allIn } from '../../../shared/storage/in-list';

type Row = {
  id: string;
  request_id: string;
  driver_id: number;
  depart_at: number;
  price: number;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  status: Offer['status'];
  booking_id: string | null;
  created_at: number;
};

const carOf = (row: Row): OfferCar | null => {
  const color = CAR_COLORS.find((item) => item === row.car_color);
  return row.car_make === null || row.car_model === null || !color
    ? null
    : { make: row.car_make, model: row.car_model, color };
};

const toOffer = (row: Row): OfferRecord => ({
  id: row.id,
  requestId: row.request_id,
  driverId: row.driver_id,
  departAt: row.depart_at,
  price: row.price,
  car: carOf(row),
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
        `INSERT INTO offers (id, request_id, driver_id, depart_at, price, status, booking_id, created_at,
         car_make, car_model, car_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET status = excluded.status, booking_id = excluded.booking_id`,
      )
      .bind(
        offer.id,
        offer.requestId,
        offer.driverId,
        offer.departAt,
        offer.price,
        offer.status,
        offer.bookingId,
        offer.createdAt,
        offer.car?.make ?? null,
        offer.car?.model ?? null,
        offer.car?.color ?? null,
      )
      .run();
  },
  replace: async (offer, expected) => {
    const result = await db
      .prepare('UPDATE offers SET status = ?, booking_id = ? WHERE id = ? AND status = ?')
      .bind(offer.status, offer.bookingId, offer.id, expected)
      .run();
    return result.meta.changes === 1;
  },
  find: async (id) => {
    const row = await db.prepare('SELECT * FROM offers WHERE id = ?').bind(id).first<Row>();
    return row ? toOffer(row) : undefined;
  },
  byRequests: async (requestIds) =>
    (await allIn<Row>(db, (marks) => `SELECT * FROM offers WHERE request_id IN (${marks})`, requestIds)).map(
      toOffer,
    ),
  byDriver: async (driverId) => all(db.prepare('SELECT * FROM offers WHERE driver_id = ?').bind(driverId)),
});
