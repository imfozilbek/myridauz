import { z } from 'zod';
import { MINI_APPS } from './analytics';
import { ROUTE_ERRORS } from './route-rule';

// Every API call of a Mini App carries the signed Telegram launch data of its bot (docs/32).
// The server checks the signature with the token of that bot: no separate login, no cookies.
export const AUTH_HEADER = 'authorization';
export const AUTH_SCHEME = 'tma';
export const MINI_APP_HEADER = 'x-mini-app';

export const authHeaders = (app: (typeof MINI_APPS)[number], initDataRaw: string) => ({
  [AUTH_HEADER]: `${AUTH_SCHEME} ${initDataRaw}`,
  [MINI_APP_HEADER]: app,
});

// Error codes of the API: ids, the text for people lives in the i18n catalog (docs/13).
export const API_ERRORS = [
  'auth.missing',
  'auth.invalid',
  'auth.expired',
  'auth.not_admin',
  'users.blocked',
  'users.not_registered',
  'users.already_registered',
  'users.invalid_contact',
  'users.invalid_input',
  'users.not_found',
  'users.avatar_hidden',
  'users.avatar_too_large',
  'drivers.not_found',
  'drivers.incomplete',
  'drivers.invalid_input',
  'drivers.wrong_status',
  'drivers.photo_too_large',
  'pricing.not_found',
  'pricing.invalid_input',
  'pricing.out_of_bounds',
  'trips.not_found',
  'trips.invalid_input',
  'trips.not_driver',
  'trips.too_many',
  'trips.too_many_seats',
  'trips.price_out_of_bounds',
  'trips.in_past',
  'trips.wrong_status',
  'bookings.not_found',
  'bookings.invalid_input',
  'bookings.too_many',
  'bookings.no_seats',
  'bookings.own_trip',
  'bookings.wrong_status',
  'wallet.not_enough',
  'wallet.invalid_input',
  'auth.not_owner',
  'chat.not_member',
  'chat.invalid_ticket',
  'shares.not_found',
  'shares.too_many',
  'shares.wrong_status',
  'favorites.not_found',
  'favorites.too_many',
  'subscriptions.not_found',
  'subscriptions.too_many',
  'subscriptions.invalid_input',
  'reviews.not_found',
  'reviews.not_over',
  'reviews.too_late',
  'reviews.invalid_input',
  'complaints.not_found',
  'complaints.already',
  'complaints.invalid_input',
  'complaints.wrong_status',
  'stats.invalid_input',
  'calls.not_allowed',
  'calls.invalid_input',
  'calls.unavailable',
  'locations.not_found',
  'locations.invalid_input',
  'channels.not_found',
  'channels.invalid_input',
  'channels.bot_not_admin',
  ...ROUTE_ERRORS,
] as const;
export type ApiErrorCode = (typeof API_ERRORS)[number];

export const apiErrorSchema = z.object({ error: z.enum(API_ERRORS) });
