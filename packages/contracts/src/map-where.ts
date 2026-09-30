import { z } from 'zod';
import { locationIdSchema } from './locations';

// The name of a point (G24, docs/69): the first step of the ladder that finds something.
// A landmark or a settlement reads «… yaqinida»; a mahalla, a street, a district as they are.
export const MAP_WHERE_PATH = '/passenger/map/where';
export const PLACE_NAME_STEPS = ['landmark', 'mahalla', 'street', 'settlement', 'district'] as const;
export type PlaceNameStep = (typeof PLACE_NAME_STEPS)[number];

export const placeNameSchema = z.object({ step: z.enum(PLACE_NAME_STEPS), name: z.string().min(1) });
export type PlaceName = z.infer<typeof placeNameSchema>;

// The district by the borders (null abroad) and the name of the point.
export const whereSchema = z.object({
  district: locationIdSchema.nullable(),
  name: placeNameSchema.nullable(),
});
export type Where = z.infer<typeof whereSchema>;
