import { z } from 'zod';
import { PASSENGER_BOOKINGS_PATH } from './bookings';
import { personIdSchema } from './person-id';

// The other passengers of one trip (G46, docs/05, docs/17): the first name and the face, never a
// phone. The face only while the trip is ahead or on the way; after it the list names whom a
// complaint can be about (docs/111 Q4).
export const bookingRidersPath = (id: string) => `${PASSENGER_BOOKINGS_PATH}/${id}/riders`;
export const coRiderSchema = z.object({ id: personIdSchema, firstName: z.string(), hasAvatar: z.boolean() });
export type CoRider = z.infer<typeof coRiderSchema>;
export const coRidersSchema = z.object({ riders: z.array(coRiderSchema) });
