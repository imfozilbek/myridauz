import { z } from 'zod';

import { chatKeySchema } from './chat';

// The personal channel of a person (docs/64, G19): the server says "something changed" and the open
// screen takes fresh data from the API. The signal carries no personal data. "call" asks the open or
// folded Mini App to open the chat of a ringing call (docs/115).
export const FEED_TICKET_PATH = '/feed/ticket';
export const FEED_SOCKET_PATH = '/feed/socket';
export const feedTicketSchema = z.object({ url: z.string() });
export const feedEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('changed') }),
  z.object({ type: z.literal('call'), chat: chatKeySchema }),
]);
export type FeedEvent = z.infer<typeof feedEventSchema>;
