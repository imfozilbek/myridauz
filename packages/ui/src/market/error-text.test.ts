import { ApiError } from '@platform/api-client';
import { describe, expect, it } from 'vitest';
import { errorKey } from './error-text';

// The codes the owner gave a text in G27 (docs/86 T1 … T9): a person reads why, not «try later».
const G27_CODES = [
  'bookings.wrong_mode',
  'bookings.outside_area',
  'favorites.too_many',
  'shares.wrong_status',
  'users.avatar_too_large',
  'drivers.incomplete',
  'trips.wrong_status',
  'calls.unavailable',
] as const;

describe('errorKey (docs/83 N04)', () => {
  it.each(G27_CODES)('explains %s with its own text', (code) => {
    expect(errorKey(new ApiError(409, code))).toBe(`errors.${code}`);
  });

  it('explains a car photo too large as any photo too large', () => {
    expect(errorKey(new ApiError(413, 'drivers.photo_too_large'))).toBe('errors.users.avatar_too_large');
  });

  it('keeps the own text of a screen for an unknown code, else the general one', () => {
    expect(errorKey(new Error('offline'), 'account.avatar.failed')).toBe('account.avatar.failed');
    expect(errorKey(new ApiError(401, 'auth.expired'))).toBe('errors.generic.description');
  });
});
