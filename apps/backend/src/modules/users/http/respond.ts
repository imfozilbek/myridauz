import type { ApiErrorCode } from '@platform/contracts';
import type { Context } from 'hono';
import type { AppEnv } from '../../../env';
import type { Caller } from '../application/ports';

// HTTP status of each error code of this module.
const STATUS = {
  'users.blocked': 403,
  'users.avatar_hidden': 404,
  'users.not_found': 404,
  'users.not_registered': 409,
  'users.already_registered': 409,
  'users.invalid_contact': 400,
  'users.invalid_input': 400,
  'users.avatar_too_large': 413,
} as const satisfies Partial<Record<ApiErrorCode, number>>;

export const fail = (context: Context<AppEnv>, error: keyof typeof STATUS) =>
  context.json({ error }, STATUS[error]);

export function callerOf(context: Context<AppEnv>): Caller {
  const { user, isAdmin } = context.get('session');
  return { id: user.id, firstName: user.firstName, isAdmin };
}
