import { z } from 'zod';
import { locationIdSchema } from './locations';

// The name of a point (G24, docs/69): the first step of the ladder that finds something.
// A landmark or a settlement reads «… yaqinida»; a mahalla, a street, a district as they are.
export const MAP_WHERE_PATH = '/passenger/map/where';
export const PLACE_NAME_STEPS = ['landmark', 'mahalla', 'street', 'settlement', 'district'] as const;
export type PlaceNameStep = (typeof PLACE_NAME_STEPS)[number];

export const placeNameSchema = z.object({ step: z.enum(PLACE_NAME_STEPS), name: z.string().min(1) });
export type PlaceName = z.infer<typeof placeNameSchema>;

// The district by the borders (null abroad), the name of the point and its area: the name
// without landmarks and streets, what the driver sees before the confirmation (docs/70).
export const whereSchema = z.object({
  district: locationIdSchema.nullable(),
  name: placeNameSchema.nullable(),
  area: placeNameSchema.nullable(),
});
export type Where = z.infer<typeof whereSchema>;

// The border of a district (G24): the map of the district is cut by it (docs/71). Rings of
// [lng, lat]; each part is its outer ring and its holes.
export const mapBorderPath = (districtId: string) => `/passenger/map/borders/${districtId}`;
const ringSchema = z.array(z.tuple([z.number(), z.number()]));
export const borderSchema = z.object({ id: locationIdSchema, parts: z.array(z.array(ringSchema)) });
export type Border = z.infer<typeof borderSchema>;

// The last places a person chose (G24, docs/71): kept only on the phone, read back with care.
export const recentPlacesSchema = z.array(
  z.object({
    point: z.object({ lat: z.number(), lng: z.number() }),
    name: placeNameSchema.nullable(),
    district: z.string(),
  }),
);
export type RecentPlace = z.infer<typeof recentPlacesSchema>[number];
