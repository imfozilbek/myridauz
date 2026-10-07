import type { BookingRule, PickupMode } from '@platform/contracts';
import type { Route } from '../places/route-screen';

export type TripDraft = {
  readonly route: Route;
  readonly pickupMode: PickupMode;
  readonly date: string;
  readonly time: string;
  readonly departAt: number;
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

// Every answer is there: the review can show and publish it. A woman driver skips the woman step.
export function completeDraft(draft: Partial<TripDraft>): TripDraft | null {
  const { route, pickupMode, date, time, departAt, seats, price, comment } = draft;
  const all = route && pickupMode && date && time && departAt && seats && price && comment !== undefined;
  return all
    ? {
        route,
        pickupMode,
        date,
        time,
        departAt,
        seats,
        price,
        comment,
        womanOnBoard: draft.womanOnBoard ?? false,
        bookingRule: draft.bookingRule ?? 'seats',
      }
    : null;
}
