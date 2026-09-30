import { FEED_TICKET_PATH, feedTicketSchema } from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The personal channel of a person (docs/64, G19): the address of its socket with a one-minute ticket.
export function createFeedClient(options: SignedOptions) {
  const { post } = signedRequest(options);
  return {
    socketUrl: async (): Promise<string> =>
      feedTicketSchema.parse(await (await post(FEED_TICKET_PATH, {})).json()).url,
  };
}

export type FeedClient = ReturnType<typeof createFeedClient>;
