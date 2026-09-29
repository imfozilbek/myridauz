import {
  bookingArrivedPath,
  bookingBoardedPath,
  bookingSchema,
  bookingSharePath,
  bookingShareStopPath,
  chatTicketPath,
  chatTicketSchema,
  driverTripSharePath,
  driverTripShareStopPath,
  sharedTripFollowPath,
  sharedTripPath,
  sharedTripSchema,
  shareSchema,
  type Booking,
  type Share,
  type SharedTrip,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The chat of a booking and "Yaqinlarimga yuborish" (docs/07, docs/43, G09).
export function createChatClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const booking = async (response: Response) => bookingSchema.parse(await response.json());
  return {
    // The address of the chat socket with a one-minute ticket.
    socketUrl: async (key: string): Promise<string> =>
      chatTicketSchema.parse(await (await post(chatTicketPath(key), {})).json()).url,
    share: async (bookingId: string): Promise<Share> =>
      shareSchema.parse(await (await post(bookingSharePath(bookingId), {})).json()),
    stopSharing: async (bookingId: string): Promise<void> =>
      void (await post(bookingShareStopPath(bookingId), {})),
    // The driver shares a trip with the family the same way (G18).
    shareTrip: async (tripId: string): Promise<Share> =>
      shareSchema.parse(await (await post(driverTripSharePath(tripId), {})).json()),
    stopTripSharing: async (tripId: string): Promise<void> =>
      void (await post(driverTripShareStopPath(tripId), {})),
    boarded: async (bookingId: string): Promise<Booking> =>
      booking(await post(bookingBoardedPath(bookingId), {})),
    arrived: async (bookingId: string): Promise<Booking> =>
      booking(await post(bookingArrivedPath(bookingId), {})),
    sharedTrip: async (token: string): Promise<SharedTrip> =>
      sharedTripSchema.parse(await (await request(sharedTripPath(token))).json()),
    follow: async (token: string): Promise<void> => void (await post(sharedTripFollowPath(token), {})),
  };
}

export type ChatClient = ReturnType<typeof createChatClient>;
