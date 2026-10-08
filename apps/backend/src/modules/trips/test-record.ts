// Test helper: one published trip record of driver 7 (docs/35), without the store.
import { endsAt, type TripRecord } from './domain/trip';

const MINUTE = 60 * 1000;
// 2026-10-02 08:00 in Tashkent.
export const DEPART = Date.parse('2026-10-02T03:00:00Z');
export const BEFORE = DEPART - 5 * 60 * MINUTE;
export const DRIVER = 7;

export const aTrip: TripRecord = {
  id: 't1',
  driverId: DRIVER,
  from: '1726269',
  to: '1718401',
  departAt: DEPART,
  endsAt: endsAt(DEPART, 300),
  km: 300,
  seats: 3,
  price: 90000,
  bookingRule: 'seats',
  womanOnBoard: false,
  comment: '',
  car: null,
  status: 'active',
  pickupMode: 'both',
  createdAt: BEFORE,
  firstDepartAt: DEPART,
  firstPrice: 90000,
  priceToldAt: null,
  departedAt: null,
  arrivedAt: null,
};
