import { APPLICATION_STATUSES, CAR_COLORS, MODERATION_REASONS, type Car } from '@platform/contracts';
import type { ApplicationRepository } from '../application/ports';
import type { Application } from '../domain/application';

type Row = {
  user_id: number;
  status: string;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  car_year: number | null;
  car_plate: string | null;
  seats: number | null;
  photo_front: string | null;
  photo_side: string | null;
  photo_interior: string | null;
  reason: string | null;
  submitted_at: number | null;
  decided_by: number | null;
  updated_at: number;
};

const oneOf = <T extends string>(values: readonly T[], value: string | null): T | null =>
  values.find((item) => item === value) ?? null;

function toCar(row: Row): Car | null {
  const color = oneOf(CAR_COLORS, row.car_color);
  if (!row.car_make || !row.car_model || !color || !row.car_year || !row.car_plate || !row.seats) return null;
  return {
    make: row.car_make,
    model: row.car_model,
    color,
    year: row.car_year,
    plate: row.car_plate,
    seats: row.seats,
  };
}

const toApplication = (row: Row): Application => ({
  userId: row.user_id,
  status: oneOf(APPLICATION_STATUSES, row.status) ?? 'draft',
  car: toCar(row),
  photos: { front: row.photo_front, side: row.photo_side, interior: row.photo_interior },
  reason: oneOf(MODERATION_REASONS, row.reason),
  submittedAt: row.submitted_at,
  decidedBy: row.decided_by,
  updatedAt: row.updated_at,
});

const UPSERT = `INSERT INTO driver_applications (user_id, status, car_make, car_model, car_color, car_year,
  car_plate, seats, photo_front, photo_side, photo_interior, reason, submitted_at, decided_by, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (user_id) DO UPDATE SET status = excluded.status, car_make = excluded.car_make,
  car_model = excluded.car_model, car_color = excluded.car_color, car_year = excluded.car_year,
  car_plate = excluded.car_plate, seats = excluded.seats, photo_front = excluded.photo_front,
  photo_side = excluded.photo_side, photo_interior = excluded.photo_interior, reason = excluded.reason,
  submitted_at = excluded.submitted_at, decided_by = excluded.decided_by, updated_at = excluded.updated_at`;

// Table driver_applications (migrations/0004_drivers.sql).
export const d1Applications = (db: D1Database): ApplicationRepository => ({
  find: async (userId) => {
    const row = await db
      .prepare('SELECT * FROM driver_applications WHERE user_id = ?')
      .bind(userId)
      .first<Row>();
    return row ? toApplication(row) : undefined;
  },
  save: async (application) => {
    const car = application.car;
    await db
      .prepare(UPSERT)
      .bind(
        application.userId,
        application.status,
        car?.make ?? null,
        car?.model ?? null,
        car?.color ?? null,
        car?.year ?? null,
        car?.plate ?? null,
        car?.seats ?? null,
        application.photos.front,
        application.photos.side,
        application.photos.interior,
        application.reason,
        application.submittedAt,
        application.decidedBy,
        application.updatedAt,
      )
      .run();
  },
  queue: async () => {
    const rows = await db
      .prepare("SELECT * FROM driver_applications WHERE status = 'pending' ORDER BY submitted_at")
      .all<Row>();
    return rows.results.map(toApplication);
  },
});
