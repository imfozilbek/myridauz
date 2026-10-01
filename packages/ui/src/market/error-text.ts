import { ApiError } from '@platform/api-client';
import type { TranslationKey } from '@platform/i18n';

// The API answers with a code; people read the text of that code, or a general one (docs/13).
const EXPLAINED: readonly string[] = [
  'trips.too_many',
  'trips.too_many_seats',
  'trips.price_out_of_bounds',
  'trips.in_past',
  'trips.not_driver',
  'locations.same_place',
  'locations.inside_city',
  'bookings.no_seats',
  'bookings.too_many',
  'bookings.own_trip',
  'bookings.wrong_status',
  'bookings.departed',
  'bookings.outside_country',
  'bookings.invalid_input',
  'wallet.not_enough',
  'auth.not_owner',
  'subscriptions.too_many',
  'reviews.not_over',
  'reviews.too_late',
  'complaints.already',
  'channels.bot_not_admin',
  'channels.invalid_input',
  // G27, docs/86 T1 … T9.
  'bookings.wrong_mode',
  'bookings.outside_area',
  'favorites.too_many',
  'shares.wrong_status',
  'users.avatar_too_large',
  'drivers.incomplete',
  'trips.wrong_status',
  'calls.unavailable',
];

// Codes that mean the same for a person as an explained one.
const SAME_AS: Readonly<Record<string, string>> = {
  'pricing.out_of_bounds': 'trips.price_out_of_bounds',
  'drivers.photo_too_large': 'users.avatar_too_large',
};

// A screen with its own text for a failure keeps it for a code without a text.
export function errorKey(
  error: unknown,
  fallback: TranslationKey = 'errors.generic.description',
): TranslationKey {
  const answered = error instanceof ApiError ? error.code : undefined;
  const code = answered ? (SAME_AS[answered] ?? answered) : undefined;
  return code && EXPLAINED.includes(code) ? (`errors.${code}` as TranslationKey) : fallback;
}
