import { ApiError } from '@platform/api-client';
import type { TranslationKey } from '@platform/i18n';

// The API answers with a code; people read the text of that code, or a general one (docs/13).
const EXPLAINED: readonly string[] = [
  'trips.too_many',
  'trips.too_many_seats',
  // G37, docs/101 R5.
  'trips.request_exists',
  'trips.price_out_of_bounds',
  'trips.in_past',
  // G38, docs/103.
  'trips.too_soon',
  'trips.busy',
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
  // G43, docs/111: codes that had no text.
  'complaints.wrong_status',
  'drivers.wrong_status',
  'shares.too_many',
  'pitaks.not_found',
  'auth.not_admin',
  'channels.not_found',
  // G63: the meeting of the driver at the point (docs/126).
  'bookings.not_meeting_time',
  'bookings.already_met',
  'bookings.already_no_show',
  'network',
  'expired.description',
  // G63, docs/140: «Yoʻlga chiqdim», «Yetib keldik» and a pitak way without a pitak.
  'trips.too_early_to_depart',
  'trips.already_departed',
  'trips.not_departed',
  'trips.already_arrived',
  'trips.no_pitak',
];

// Codes that mean the same for a person as an explained one.
const SAME_AS: Readonly<Record<string, string>> = {
  'pricing.out_of_bounds': 'trips.price_out_of_bounds',
  'drivers.photo_too_large': 'users.avatar_too_large',
  // No answer from the API: the network dropped or was too slow (G43).
  'network.failed': 'network',
  'network.timeout': 'network',
  // The launch data of Telegram lives 24 hours: a new launch signs again (G43).
  'auth.expired': 'expired.description',
};

// The text of an answer code of the API, null for a code without one (the dashboard, G52).
export function codeKey(answered: string): TranslationKey | null {
  const code = SAME_AS[answered] ?? answered;
  return EXPLAINED.includes(code) ? (`errors.${code}` as TranslationKey) : null;
}

// A screen with its own text for a failure keeps it for a code without a text.
export function errorKey(
  error: unknown,
  fallback: TranslationKey = 'errors.generic.description',
): TranslationKey {
  const answered = error instanceof ApiError ? error.code : undefined;
  return (answered && codeKey(answered)) || fallback;
}
