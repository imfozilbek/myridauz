import { z } from 'zod';
import { pointSchema } from './bookings';
import { locationIdSchema } from './locations';

// Search by name on the map (G23, docs/67): names from the same OpenStreetMap data, in D1.
export const MAP_SEARCH_PATH = '/passenger/map/search';
// Fewer letters find thousands of places and help nobody.
export const SEARCH_MIN_LETTERS = 2;
export const SEARCH_RESULTS = 10;

// What a place is: the list shows an icon for each kind.
export const PLACE_KINDS = [
  'mahalla',
  'settlement',
  'street',
  'market',
  'school',
  'mosque',
  'health',
  'transport',
  'place',
] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export const foundPlaceSchema = z.object({
  name: z.string(),
  kind: z.enum(PLACE_KINDS),
  // The district or city around the place: two «Navoiy koʻchasi» differ by it.
  area: z.string().nullable(),
  // Its id: choosing the place sets the district of the trip (G24).
  district: locationIdSchema.nullable(),
  point: pointSchema,
});
export type FoundPlace = z.infer<typeof foundPlaceSchema>;
export const placeSearchSchema = z.object({ places: z.array(foundPlaceSchema) });
