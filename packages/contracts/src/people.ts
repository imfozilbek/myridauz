import { z } from 'zod';
import { personIdSchema, type PersonId } from './person-id';

// «Odamlar» of the owner (G75, docs/120, G45): one person by the public id, with what the team needs
// to decide: rides, complaints, the rating, the car and the block. Never the phone (docs/07).
export const adminPersonPath = (id: PersonId) => `/admin/people/${id}`;

const count = z.number().int().nonnegative();

export const personCardSchema = z.object({
  id: personIdSchema,
  firstName: z.string(),
  hasAvatar: z.boolean(),
  joinedAt: z.number().int().nullable(),
  rating: z.object({ average: z.number().nullable(), count }),
  // As a driver: the trips; as a passenger: the rides (docs/17).
  trips: count,
  rides: count,
  complaintsAgainst: count,
  car: z.object({ make: z.string(), model: z.string(), plate: z.string() }).nullable(),
  // Until when; null with blocked: for good (docs/17).
  blocked: z.boolean(),
  blockedUntil: z.number().int().nullable(),
});
export type PersonCard = z.infer<typeof personCardSchema>;

// The Telegram account of a person in the checks of the team (owner, 17.10.2026): the public name
// opens the profile; without one, the link through the bot the person writes to (owner, 18.10.2026).
// Never shown to other people (docs/07).
export const adminTelegramPath = (userId: PersonId) => `/admin/people/${userId}/telegram`;
export const telegramAccountSchema = z.object({
  username: z.string().nullable(),
  profileLink: z.string().url(),
});
export type TelegramAccount = z.infer<typeof telegramAccountSchema>;
