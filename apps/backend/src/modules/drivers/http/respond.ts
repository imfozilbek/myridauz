import type { ApiErrorCode } from '@platform/contracts';
import type { Context } from 'hono';
import type { AppEnv } from '../../../env';
import type { StoredImage } from '../../../shared/storage/image-store';

// HTTP status of each error code of this module.
const STATUS = {
  'auth.not_admin': 403,
  'drivers.not_found': 404,
  'drivers.incomplete': 409,
  'drivers.wrong_status': 409,
  'drivers.invalid_input': 400,
  'drivers.photo_too_large': 413,
  'drivers.live_trips': 409,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

export type DriversError = keyof typeof STATUS;

export const fail = (context: Context<AppEnv>, error: DriversError) => context.json({ error }, STATUS[error]);

// Personal photos: a short private cache only (docs/30).
export const image = (context: Context<AppEnv>, found: StoredImage | undefined) =>
  found
    ? context.body(found.body, 200, { 'content-type': found.type, 'cache-control': 'private, max-age=300' })
    : fail(context, 'drivers.not_found');
