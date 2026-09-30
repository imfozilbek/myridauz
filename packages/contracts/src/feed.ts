import { z } from 'zod';

// The personal channel of a person (docs/64, G19): the server says "something changed" and the open
// screen takes fresh data from the API. The signal carries no personal data.
export const FEED_TICKET_PATH = '/feed/ticket';
export const FEED_SOCKET_PATH = '/feed/socket';
export const feedTicketSchema = z.object({ url: z.string() });
export const feedEventSchema = z.object({ type: z.literal('changed') });
export type FeedEvent = z.infer<typeof feedEventSchema>;
