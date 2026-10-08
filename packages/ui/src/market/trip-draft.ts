import type {
  BookingRule,
  PickupMode,
  Pitak,
  Recommendation,
  Schedule,
  ScheduleRules,
} from '@platform/contracts';
import type { Route } from '../places/route-screen';
import { departAtOf, firstDayOf, slotsOn, timeOn } from './first-when';

export type TripDraft = {
  readonly route: Route;
  readonly pickupMode: PickupMode;
  readonly date: string;
  readonly time: string;
  readonly seats: number;
  readonly price: number;
  readonly womanOnBoard: boolean;
  readonly bookingRule: BookingRule;
  readonly comment: string;
};

// The answers of the last trip a new one starts with (G40, docs/106 K3). «Mashinada ayol bor» is
// asked again: who rides with the driver is new each time.
export type TripAgain = Pick<TripDraft, 'pickupMode' | 'seats' | 'price' | 'comment'> &
  Partial<Pick<TripDraft, 'bookingRule'>>;

type Known = {
  readonly now: number;
  readonly schedule: Schedule;
  readonly rules: ScheduleRules;
  readonly recommendation: Recommendation;
  // The pitak of the direction; none: the driver takes people at their doors (docs/72).
  readonly pitak: Pitak | null;
  readonly carSeats: number;
  readonly isMan: boolean;
};

export type TripValues = Omit<TripDraft, 'time'> & {
  // null: the day has no free time left, the day and time are chosen again (docs/103).
  readonly time: string | null;
  // «Mashinada ayol bor» is asked of a man who takes fewer people than his car has (docs/06, point 3).
  readonly askWoman: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// What the one screen shows (G63, docs/118 path 6): each answer of the driver, else its start: all
// the seats of the car, the recommended price, the pitak when the direction has one, the first day.
export function tripValues(answer: Partial<TripDraft> & { readonly route: Route }, known: Known): TripValues {
  const { now, schedule, rules, recommendation, pitak, carSeats, isMan } = known;
  const date = answer.date ?? firstDayOf(now, schedule, rules);
  // A time kept in the draft may be gone since: the first free one of the day instead (docs/103).
  const slots = slotsOn(date, now, schedule, rules);
  const time = answer.time && slots.includes(answer.time) ? answer.time : timeOn(date, now, schedule, rules);
  const seats = clamp(answer.seats ?? carSeats, 1, carSeats);
  const askWoman = isMan && seats < carSeats;
  const mode = answer.pickupMode ?? 'pitak';
  return {
    route: answer.route,
    pickupMode: pitak ? mode : 'door',
    date,
    time,
    seats,
    price: clamp(answer.price ?? recommendation.price, recommendation.minPrice, recommendation.maxPrice),
    womanOnBoard: askWoman && (answer.womanOnBoard ?? false),
    askWoman,
    bookingRule: answer.bookingRule ?? 'seats',
    comment: answer.comment ?? '',
  };
}

// The trip to publish; null until the day has a time.
export function publishInput(values: TripValues) {
  const { route, date, time, seats, price, womanOnBoard, comment, pickupMode, bookingRule } = values;
  if (!time) return null;
  const departAt = departAtOf(date, time);
  return {
    from: route.from.id,
    to: route.to.id,
    departAt,
    seats,
    price,
    womanOnBoard,
    comment,
    pickupMode,
    bookingRule,
  };
}
