import { z } from 'zod';

// A point on the map: a pickup, a drop-off, a pitak, a place of the search (docs/14, docs/69).
export const pointSchema = z.object({ lat: z.number(), lng: z.number() });
export type Point = z.infer<typeof pointSchema>;
// A point a person sends: only real coordinates.
export const pointInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
