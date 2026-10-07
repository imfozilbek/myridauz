import { BOOKING_RULES, CAR_COLORS, PICKUP_MODES, TRIP_STATUSES } from '@platform/contracts';
import type { TripCar, TripRecord } from '../domain/trip';

// A row of the table trips (migrations 0007, 0035, 0043) and the trip it holds.
export type TripRow = {
  id: string;
  driver_id: number;
  from_id: string;
  to_id: string;
  depart_at: number;
  ends_at: number;
  km: number;
  seats: number;
  price: number;
  woman_on_board: number;
  comment: string;
  car_make: string | null;
  car_model: string | null;
  car_color: string | null;
  car_plate: string | null;
  status: string;
  pickup_mode: string;
  created_at: number;
  first_depart_at: number | null;
  first_price: number | null;
  price_told_at: number | null;
  booking_rule: string;
};

const carOf = (row: TripRow): TripCar | null => {
  const color = CAR_COLORS.find((item) => item === row.car_color);
  if (row.car_make === null || row.car_model === null || !color || row.car_plate === null) return null;
  return { make: row.car_make, model: row.car_model, color, plate: row.car_plate };
};

export const toTrip = (row: TripRow): TripRecord => ({
  id: row.id,
  driverId: row.driver_id,
  from: row.from_id,
  to: row.to_id,
  departAt: row.depart_at,
  endsAt: row.ends_at,
  km: row.km,
  seats: row.seats,
  price: row.price,
  womanOnBoard: row.woman_on_board === 1,
  comment: row.comment,
  car: carOf(row),
  status: TRIP_STATUSES.find((status) => status === row.status) ?? 'cancelled',
  pickupMode: PICKUP_MODES.find((mode) => mode === row.pickup_mode) ?? 'both',
  createdAt: row.created_at,
  // Trips made before G39 had no first time and price: their own are the first ones.
  firstDepartAt: row.first_depart_at ?? row.depart_at,
  firstPrice: row.first_price ?? row.price,
  priceToldAt: row.price_told_at,
  bookingRule: BOOKING_RULES.find((rule) => rule === row.booking_rule) ?? 'seats',
});
