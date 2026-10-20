import {
  rangeEnds,
  rangeStarts,
  slotAt,
  type BookingRule,
  type PickupMode,
  type Pitak,
  type Recommendation,
  type ScheduleRules,
} from '@platform/contracts';
import type { Route } from '../places/route-screen';
import { firstDayOf, slotsOn, timeOn } from './first-when';

export type TripDraft = {
  readonly route: Route;
  readonly pickupMode: PickupMode;
  readonly date: string;
  readonly time: string;
  // The end of a range from time (G90, docs/216); null: one exact time.
  readonly until: string | null;
  readonly seats: number;
  readonly price: number;
  readonly womanOnBoard: boolean;
  readonly bookingRule: BookingRule;
  readonly comment: string;
};

// The answers of the last trip a new one starts with (G40, docs/106 K3). «Mashinada ayol bor» is
// asked again: who rides with the driver is new each time. The way back of «Qaytish» (G63) also
// brings its day, its time and «Mashinada ayol bor» of the trip there (docs/40).
export type TripAgain = Pick<TripDraft, 'pickupMode' | 'seats' | 'price' | 'comment'> &
  Partial<Pick<TripDraft, 'bookingRule' | 'date' | 'time' | 'womanOnBoard'>>;

type Known = {
  readonly now: number;
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
  const { now, rules, recommendation, pitak, carSeats, isMan } = known;
  const date = answer.date ?? firstDayOf(now, rules);
  // A time kept in the draft may be gone since: the first free one of the day instead (docs/103).
  const slots = slotsOn(date, now, rules);
  const time = answer.time && slots.includes(answer.time) ? answer.time : timeOn(date, now, rules);
  // A range stays while its start is still a start and its end one of its ends.
  const range = time === answer.time && rangeStarts(date, now, rules).includes(time);
  const until =
    range && answer.until && rangeEnds(date, time, rules).includes(answer.until) ? answer.until : null;
  const seats = clamp(answer.seats ?? carSeats, 1, carSeats);
  const askWoman = isMan && seats < carSeats;
  const mode = answer.pickupMode ?? 'pitak';
  return {
    route: answer.route,
    pickupMode: pitak ? mode : 'door',
    date,
    time,
    until,
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
  const { route, date, time, until, seats, price, womanOnBoard, comment, pickupMode, bookingRule } = values;
  if (!time) return null;
  return {
    from: route.from.id,
    to: route.to.id,
    departAt: slotAt(date, time),
    departUntil: until ? slotAt(date, until) : null,
    seats,
    price,
    womanOnBoard,
    comment,
    pickupMode,
    bookingRule,
  };
}
