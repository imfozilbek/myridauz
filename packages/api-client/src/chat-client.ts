import {
  bookingArrivedPath,
  bookingCamePath,
  bookingSchema,
  bookingSharePath,
  chatAboutPath,
  chatAboutSchema,
  chatMessagesPath,
  CHATS_UNREAD_PATH,
  bookingShareStopPath,
  chatTicketPath,
  chatTicketSchema,
  driverTripSharePath,
  driverTripStoryPath,
  driverTripShareStopPath,
  sharedTripFollowPath,
  sharedTripPath,
  sharedTripSchema,
  shareSchema,
  storySchema,
  unreadChatsSchema,
  type Booking,
  type ChatAbout,
  type Share,
  type SharedTrip,
  type Story,
  type UnreadChat,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The chat of a booking and "Yaqinlarimga yuborish" (docs/07, docs/43, G09).
export function createChatClient(options: SignedOptions) {
  const { request, post, put } = signedRequest(options);
  const booking = async (response: Response) => bookingSchema.parse(await response.json());
  return {
    // The address of the chat socket with a one-minute ticket.
    socketUrl: async (key: string): Promise<string> =>
      chatTicketSchema.parse(await (await post(chatTicketPath(key), {})).json()).url,
    // The booking of the chat for the call screen: who and which trip (G54).
    about: async (key: string): Promise<ChatAbout> =>
      chatAboutSchema.parse(await (await request(chatAboutPath(key))).json()),
    // The sheet «Yangi xabar» (G68, docs/122): the last words of the unread chats of this Mini App and
    // a ready answer that goes without opening the chat.
    unread: async (): Promise<UnreadChat[]> =>
      unreadChatsSchema.parse(await (await request(CHATS_UNREAD_PATH)).json()).chats,
    answer: async (key: string, text: string): Promise<void> =>
      void (await post(chatMessagesPath(key), { text })),
    share: async (bookingId: string): Promise<Share> =>
      shareSchema.parse(await (await post(bookingSharePath(bookingId), {})).json()),
    stopSharing: async (bookingId: string): Promise<void> =>
      void (await post(bookingShareStopPath(bookingId), {})),
    // The driver shares a trip with the family the same way (G18).
    shareTrip: async (tripId: string): Promise<Share> =>
      shareSchema.parse(await (await post(driverTripSharePath(tripId), {})).json()),
    stopTripSharing: async (tripId: string): Promise<void> =>
      void (await post(driverTripShareStopPath(tripId), {})),
    // «Hikoyaga joylash»: the picture drawn by the Mini App goes up, Telegram reads it (docs/88 L19).
    putTripStory: async (tripId: string, image: Blob): Promise<Story> =>
      storySchema.parse(await (await put(driverTripStoryPath(tripId), image)).json()),
    came: async (bookingId: string): Promise<Booking> => booking(await post(bookingCamePath(bookingId), {})),
    arrived: async (bookingId: string): Promise<Booking> =>
      booking(await post(bookingArrivedPath(bookingId), {})),
    sharedTrip: async (token: string): Promise<SharedTrip> =>
      sharedTripSchema.parse(await (await request(sharedTripPath(token))).json()),
    follow: async (token: string): Promise<void> => void (await post(sharedTripFollowPath(token), {})),
  };
}

export type ChatClient = ReturnType<typeof createChatClient>;
