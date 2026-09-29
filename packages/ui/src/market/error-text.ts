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
];

export function errorKey(error: unknown): TranslationKey {
  const code = error instanceof ApiError ? error.code : undefined;
  return code && EXPLAINED.includes(code)
    ? (`errors.${code}` as TranslationKey)
    : 'errors.generic.description';
}
