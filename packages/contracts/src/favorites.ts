import { z } from 'zod';
import { personIdSchema, type PersonId } from './person-id';
import { CAR_COLORS } from './drivers';
import { ratingSchema } from './ratings';
import { tripSchema } from './trips';

// "Sevimli haydovchilar" (docs/18): a passenger saves a driver and sees the driver's new trips;
// the bot tells about each new one. G18.
export const FAVORITES_PATH = '/passenger/favorites';
export const favoritePath = (driverId: PersonId) => `${FAVORITES_PATH}/${driverId}`;
export const MAX_FAVORITES = 50;

export const favoriteDriverSchema = z.object({
  id: personIdSchema,
  firstName: z.string(),
  hasAvatar: z.boolean(),
  car: z.object({ make: z.string(), model: z.string(), color: z.enum(CAR_COLORS) }),
  rating: ratingSchema,
});
export type FavoriteDriver = z.infer<typeof favoriteDriverSchema>;

// The saved drivers and their trips that still take passengers, the earliest first.
export const favoritesSchema = z.object({
  drivers: z.array(favoriteDriverSchema),
  trips: z.array(tripSchema),
});
export type Favorites = z.infer<typeof favoritesSchema>;
