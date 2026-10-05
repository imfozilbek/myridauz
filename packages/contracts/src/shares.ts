import { z } from 'zod';
import { CAR_COLORS } from './drivers';
import { locationIdSchema } from './locations';
import { PASSENGER_BOOKINGS_PATH } from './bookings';

// "Yaqinlarimga yuborish" (docs/43): close people follow the trip by a link, without registration.
export const bookingSharePath = (id: string) => `${PASSENGER_BOOKINGS_PATH}/${id}/share`;
export const bookingShareStopPath = (id: string) => `${bookingSharePath(id)}/stop`;
export const bookingBoardedPath = (id: string) => `${PASSENGER_BOOKINGS_PATH}/${id}/boarded`;
export const bookingArrivedPath = (id: string) => `${PASSENGER_BOOKINGS_PATH}/${id}/arrived`;
// The driver shares a trip with the family the same way (docs/43). G18.
export const driverTripSharePath = (tripId: string) => `/driver/trips/${tripId}/share`;
export const driverTripShareStopPath = (tripId: string) => `${driverTripSharePath(tripId)}/stop`;
export const SHARED_TRIPS_PATH = '/shared';
export const sharedTripPath = (token: string) => `${SHARED_TRIPS_PATH}/${token}`;
export const sharedTripFollowPath = (token: string) => `${sharedTripPath(token)}/follow`;

export const MAX_FOLLOWERS = 5;
export const SHARE_TOKEN = /^[A-Za-z0-9_-]{43}$/u;
export const shareTokenSchema = z.string().regex(SHARE_TOKEN);

// Telegram's own "send to a chat" window (shareMessage), or a plain link when it is not there.
export const shareSchema = z.object({ preparedMessageId: z.string().nullable(), link: z.string() });
export type Share = z.infer<typeof shareSchema>;

export const SHARE_STATUSES = [
  'waiting',
  'boarded',
  'on_the_way',
  'arrived',
  'completed',
  'cancelled',
] as const;
export type ShareStatus = (typeof SHARE_STATUSES)[number];

// What close people see (docs/43): never a phone or the chat. Where the passenger boards and gets
// off they see: the passenger chose whom to trust (the owner, docs/111 Q1).
// passengerName: the one who shared, the passenger of a booking or the driver of the trip (G18).
export const sharedTripSchema = z.object({
  passengerName: z.string(),
  from: locationIdSchema,
  to: locationIdSchema,
  departAt: z.number().int(),
  km: z.number().int(),
  driver: z.object({
    firstName: z.string(),
    car: z.object({ make: z.string(), model: z.string(), color: z.enum(CAR_COLORS) }),
  }),
  plate: z.string().nullable(),
  meetingPoint: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  dropoffPoint: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  status: z.enum(SHARE_STATUSES),
  followers: z.number().int(),
});
export type SharedTrip = z.infer<typeof sharedTripSchema>;
