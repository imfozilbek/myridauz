import { chatKeyOfBooking, chatKeyOfOffer, chatKeyOfTalk } from '@platform/contracts';

// A driver and a passenger about one request (G64, docs/118 path 7): one chat before the offer, with
// the offers of this driver on the request and the booking one of them became.
export type TalkRecord = {
  readonly id: string;
  readonly requestId: string;
  readonly driverId: number;
  readonly createdAt: number;
};

// The chat of an offer or a booking: the talk's when it came from one (G64), else as before G64.
export const offerChatKey = (offer: { readonly id: string; readonly talkId: string | null }) =>
  offer.talkId ? chatKeyOfTalk(offer.talkId) : chatKeyOfOffer(offer.id);
export const bookingChatKey = (booking: {
  readonly id: string;
  readonly offerId: string | null;
  readonly talkId: string | null;
}) => {
  if (booking.talkId) return chatKeyOfTalk(booking.talkId);
  return booking.offerId ? chatKeyOfOffer(booking.offerId) : chatKeyOfBooking(booking.id);
};
