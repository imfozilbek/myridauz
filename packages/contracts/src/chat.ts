import { z } from 'zod';
import { bookingSchema } from './bookings';
import { callClientEvents, callServerEvents } from './calls';

// The chat of one booking (docs/07, G09): "b" + booking id, or "o" + offer id for the second way.
export const CHAT_KEY = /^[bo][0-9a-f-]{36}$/u;
export const chatKeySchema = z.string().regex(CHAT_KEY);
export const chatKeyOfBooking = (bookingId: string) => `b${bookingId}`;
export const chatKeyOfOffer = (offerId: string) => `o${offerId}`;

// A signed ticket opens the socket: a browser WebSocket cannot carry the Telegram signature.
export const chatTicketPath = (key: string) => `/chats/${key}/ticket`;
export const chatSocketPath = (key: string) => `/chats/${key}/socket`;
// The booking of a chat as this person sees it: who is on the other side and which trip (G54).
export const chatAboutPath = (key: string) => `/chats/${key}/about`;
// role: the side of the person who asks; the call screen shows the other side.
export const chatAboutSchema = z.object({
  booking: bookingSchema.nullable(),
  role: z.enum(['passenger', 'driver']).nullable(),
});
export type ChatAbout = z.infer<typeof chatAboutSchema>;
export const chatTicketSchema = z.object({ url: z.string() });

export const MAX_CHAT_TEXT = 1000;
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
  z.object({ type: z.literal('history'), messages: z.array(chatMessageSchema), canCall: z.boolean() }),
  z.object({ type: z.literal('message'), message: chatMessageSchema }),
  z.object({ type: z.literal('warning') }),
  ...callServerEvents,
]);
export type ChatServerEvent = z.infer<typeof chatServerEventSchema>;

// What the Mini App sends: a text, or a step of a call (docs/07, docs/08). The voice never goes here.
export const chatClientEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('send'), text: z.string().trim().min(1).max(MAX_CHAT_TEXT) }),
  ...callClientEvents,
]);
export type ChatClientEvent = z.infer<typeof chatClientEventSchema>;
