import { z } from 'zod';
import { bookingSchema } from './bookings';
import { callClientEvents, callServerEvents } from './calls';
import { offerSchema } from './offers';
import { rideRequestSchema } from './ride-requests';

// The chat of one booking (docs/07, G09): "b" + booking id, or "o" + offer id for the second way;
// "t" + talk id: a driver and a passenger about a request, before and after the offer (G64, docs/118).
export const CHAT_KEY = /^[bot][0-9a-f-]{36}$/u;
export const chatKeySchema = z.string().regex(CHAT_KEY);
export const chatKeyOfBooking = (bookingId: string) => `b${bookingId}`;
export const chatKeyOfOffer = (offerId: string) => `o${offerId}`;
export const chatKeyOfTalk = (talkId: string) => `t${talkId}`;

// A signed ticket opens the socket: a browser WebSocket cannot carry the Telegram signature.
export const chatTicketPath = (key: string) => `/chats/${key}/ticket`;
export const chatSocketPath = (key: string) => `/chats/${key}/socket`;
// A driver opens the talk about a request before any offer (G64, docs/118 path 7).
export const requestTalkPath = (requestId: string) => `/driver/requests/${requestId}/talk`;
export const requestTalkSchema = z.object({ chatKey: z.string() });
// The booking of a chat as this person sees it: who is on the other side and which trip (G54).
export const chatAboutPath = (key: string) => `/chats/${key}/about`;
// role: the side of the person who asks; the call screen shows the other side.
// A talk about a request (G64): the request on top of the chat and the offer of this driver, the
// latest one; both null in a chat of a booking. driver: who the passenger talks to before any offer.
export const chatAboutSchema = z.object({
  booking: bookingSchema.nullable(),
  role: z.enum(['passenger', 'driver']).nullable(),
  request: rideRequestSchema.nullable().default(null),
  offer: offerSchema.nullable().default(null),
  driver: offerSchema.shape.driver.nullable().default(null),
});
export type ChatAbout = z.infer<typeof chatAboutSchema>;
export const chatTicketSchema = z.object({ url: z.string() });

export const MAX_CHAT_TEXT = 1000;

// The newest unread chats of the person in this Mini App with their last message (G68, docs/122):
// the sheet «Yangi xabar» shows the words and a ready answer goes in one tap, the chat stays closed.
export const CHATS_UNREAD_PATH = '/chats/unread';
export const unreadChatSchema = z.object({
  key: chatKeySchema,
  count: z.number().int(),
  text: z.string(),
  at: z.number().int(),
});
export type UnreadChat = z.infer<typeof unreadChatSchema>;
export const unreadChatsSchema = z.object({ chats: z.array(unreadChatSchema) });
export const chatMessagesPath = (key: string) => `/chats/${key}/messages`;
export const chatTextSchema = z.object({ text: z.string().trim().min(1).max(MAX_CHAT_TEXT) });
// System lines about the booking, shown in the middle of the chat.
// missed_call: a call that did not happen (docs/08, G13).
export const CHAT_SYSTEM_EVENTS = [
  'requested',
  'offered',
  'confirmed',
  'declined',
  'cancelled',
  'missed_call',
] as const;
export type ChatSystemEvent = (typeof CHAT_SYSTEM_EVENTS)[number];

export const chatMessageSchema = z.object({
  id: z.number().int(),
  author: z.enum(['me', 'other', 'system']),
  text: z.string(),
  event: z.enum(CHAT_SYSTEM_EVENTS).nullable(),
  at: z.number().int(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// What the server sends on the socket. "warning": a contact was hidden in the sender's message.
export const chatServerEventSchema = z.discriminatedUnion('type', [
  // canCall: a voice call is open only after the booking is confirmed (docs/08).
  z.object({
    type: z.literal('history'),
    messages: z.array(chatMessageSchema),
    canCall: z.boolean(),
    // Missing from an older server: the chat is open.
    canWrite: z.boolean().default(true),
  }),
  z.object({ type: z.literal('message'), message: chatMessageSchema }),
  z.object({ type: z.literal('warning') }),
  ...callServerEvents,
]);
export type ChatServerEvent = z.infer<typeof chatServerEventSchema>;

// What the Mini App sends: a text, or a step of a call (docs/07, docs/08). The voice never goes here.
export const chatClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('send'), text: chatTextSchema.shape.text }),
  ...callClientEvents,
]);
export type ChatClientEvent = z.infer<typeof chatClientEventSchema>;
