import type { CommissionRule } from './brand-config';

// docs/12: a percent of the price per seat, never less than the minimum per seat, times the seats.
// One formula for the backend charge and the sum a driver sees before confirming (G08).
export const commissionFor = (rule: CommissionRule, price: number, seats: number) =>
  seats * Math.max(Math.round((price * rule.percent) / 100), rule.minPerSeat);
