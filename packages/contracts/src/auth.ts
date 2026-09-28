import { z } from 'zod';
import { MINI_APPS } from './analytics';

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
] as const;
export type ApiErrorCode = (typeof API_ERRORS)[number];

export const apiErrorSchema = z.object({ error: z.enum(API_ERRORS) });
