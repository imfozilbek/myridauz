import { z } from 'zod';
import { BOOKING_STATUSES } from './bookings';
import { COMPLAINT_REASONS, COMPLAINT_STATUSES } from './complaints';
import { locationIdSchema } from './locations';
import { personIdSchema, type PersonId } from './person-id';
import { TRIP_STATUSES } from './trips';

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

// What a person did lately, for «Odamlar» (G45, docs/120): the newest trips as a driver, rides as a
// passenger and complaints against them, a few each; the seats the person cancelled after a «yes».
export const personActivityPath = (id: PersonId) => `/admin/people/${id}/activity`;
export const ACTIVITY_ROWS = 10;
const route = { from: locationIdSchema, to: locationIdSchema, departAt: z.number().int() };
export const personActivitySchema = z.object({
  trips: z.array(z.object({ id: z.string(), ...route, status: z.enum(TRIP_STATUSES) })),
  rides: z.array(
    z.object({ id: z.string(), tripId: z.string(), ...route, status: z.enum(BOOKING_STATUSES) }),
  ),
  complaints: z.array(
    z.object({
      id: z.string(),
      reasons: z.array(z.enum(COMPLAINT_REASONS)),
      status: z.enum(COMPLAINT_STATUSES),
      at: z.number().int(),
    }),
  ),
  // Confirmed seats cancelled: by the person as a driver, as a passenger (docs/81 A07).
  cancels: z.object({ asDriver: count, asPassenger: count }),
});
export type PersonActivity = z.infer<typeof personActivitySchema>;

// The Telegram account of a person in the checks of the team (owner, 17.10.2026): the public name
// opens the profile; without one, the link through the bot the person writes to (owner, 18.10.2026).
// Never shown to other people (docs/07).
export const adminTelegramPath = (userId: PersonId) => `/admin/people/${userId}/telegram`;
export const telegramAccountSchema = z.object({
  username: z.string().nullable(),
  profileLink: z.string().url(),
});
export type TelegramAccount = z.infer<typeof telegramAccountSchema>;
