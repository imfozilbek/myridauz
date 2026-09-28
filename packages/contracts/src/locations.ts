import { z } from 'zod';

// Regions, districts and cities (docs/14). id is the SOATO code of the unit. G05.
export const LOCATIONS_PATH = '/locations';
export const LOCATION_DISTANCE_PATH = '/locations/distance';

export const LOCATION_TYPES = ['region', 'district', 'city'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const locationIdSchema = z.string().regex(/^\d{4,10}$/);

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const locationSchema = z.object({
  id: locationIdSchema,
  // null: a region (level 1). Otherwise the region of a district or a city (level 2).
  parentId: locationIdSchema.nullable(),
  type: z.enum(LOCATION_TYPES),
  name: z.string().min(1),
  lat: latitude,
  lng: longitude,
  // A region that is one city (Toshkent shahri): its districts are one place for trips (docs/14).
  oneCity: z.boolean(),
});
export type Location = z.infer<typeof locationSchema>;

// The whole directory in one answer: it is small and almost never changes, so it is cached.
export const locationsResponseSchema = z.object({
  version: z.string(),
  locations: z.array(locationSchema),
});
export type LocationsResponse = z.infer<typeof locationsResponseSchema>;

// Road distances between level 2 places. The team can correct a distance by hand.
export const MAX_DISTANCE_KM = 3000;
const kmSchema = z.number().int().min(1).max(MAX_DISTANCE_KM);

export const distanceQuerySchema = z.object({ from: locationIdSchema, to: locationIdSchema });
// A distance between two places: the answer to a query and the body of a correction by the team.
export const distanceSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  km: kmSchema,
});
export type Distance = z.infer<typeof distanceSchema>;
