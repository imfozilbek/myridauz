import { placeNameSchema, type Point } from '@platform/contracts';
import { z } from 'zod';
import type { Named } from '../domain/booking';

const namedSchema = z.object({ name: placeNameSchema.nullable(), area: placeNameSchema.nullable() });

export const pointOf = (lat: number | null, lng: number | null): Point | null =>
  lat === null || lng === null ? null : { lat, lng };

// The names are JSON: a broken or an old value reads as no names, never as an error.
export function namedOf(json: string | null): Named | null {
  if (json === null) return null;
  try {
    const parsed = namedSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
