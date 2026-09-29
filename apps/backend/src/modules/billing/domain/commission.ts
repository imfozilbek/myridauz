import type { CommissionRule } from '@platform/brands';

// docs/12: a percent of the price per seat, never less than the minimum per seat, times the seats.
export const commissionFor = (rule: CommissionRule, price: number, seats: number) =>
  seats * Math.max(Math.round((price * rule.percent) / 100), rule.minPerSeat);

// Who cancelled a confirmed booking decides the refund (docs/12): the passenger → back to the
// wallet; the driver → no refund, against cancelling after a booking.
export type Canceller = 'passenger' | 'driver';
export const refundsCommission = (by: Canceller) => by === 'passenger';
