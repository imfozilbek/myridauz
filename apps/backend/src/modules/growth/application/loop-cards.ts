import { loopVia, type LoopCard, type PreparedCard } from '@platform/contracts';
import type { CardMessage, GrowthStore, Side } from './ports';

// The facts of a request or a booked seat a person shares (docs/123 loops 2 and 3).
type Request = {
  readonly passengerId: number;
  readonly from: string;
  readonly to: string;
  readonly date: string;
};
type Seat = {
  readonly passengerId: number;
  readonly tripId: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly seatsLeft: number;
};
export type LoopInput =
  | ({ readonly loop: 'req-share'; readonly seats: number } & Request)
  | ({ readonly loop: 'seats'; readonly seats: number } & Seat);

export type LoopDeps = {
  readonly store: GrowthStore;
  // An open request of the person; undefined: none, or not open any more.
  readonly request: (id: string) => Promise<(Request & { readonly seats: number }) | undefined>;
  // A booked seat on a trip with free seats; undefined: none.
  readonly seat: (id: string) => Promise<Seat | undefined>;
  readonly loopMessage: (input: LoopInput) => Promise<CardMessage>;
  readonly links: {
    readonly requests: (request: Request, via: string) => string;
    readonly trip: (tripId: string, via: string) => string;
  };
  // The passenger app shares both: its bot keeps the message (docs/43).
  readonly prepare: (
    side: Side,
    userId: number,
    message: CardMessage,
    link: string,
  ) => Promise<string | null>;
};

async function inputOf(deps: LoopDeps, userId: number, card: LoopCard): Promise<LoopInput | null> {
  if (card.loop === 'req-share') {
    const request = await deps.request(card.requestId);
    return request?.passengerId === userId ? { loop: card.loop, ...request } : null;
  }
  const seat = await deps.seat(card.bookingId);
  return seat?.passengerId === userId && seat.seatsLeft > 0
    ? { loop: card.loop, ...seat, seats: seat.seatsLeft }
    : null;
}

// The card of a loop with the mark of its loop and the code of the person (docs/116); only of the
// person's own request or seat. null: nothing to share.
export async function loopCard(deps: LoopDeps, userId: number, card: LoopCard): Promise<PreparedCard | null> {
  const input = await inputOf(deps, userId, card);
  if (!input) return null;
  const via = loopVia(input.loop, await deps.store.codeOf(userId));
  const link =
    input.loop === 'req-share' ? deps.links.requests(input, via) : deps.links.trip(input.tripId, via);
  const message = await deps.loopMessage(input);
  return { prepared: await deps.prepare('passenger', userId, message, link), link };
}
