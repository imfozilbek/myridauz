import { loopVia, type LoopCard, type PreparedCard } from '@platform/contracts';
import type { CardMessage, GrowthStore, Side } from './ports';

// The facts of a request, a booked seat or the driver's own trip a person shares (docs/123, G88).
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
type OwnTrip = {
  readonly driverId: number;
  readonly tripId: string;
  readonly from: string;
  readonly to: string;
  readonly departAt: number;
  readonly seatsLeft: number;
  readonly price: number;
};
export type LoopInput =
  | ({ readonly loop: 'req-share'; readonly seats: number } & Request)
  | ({ readonly loop: 'seats'; readonly seats: number } & Seat)
  | ({ readonly loop: 'trip' } & OwnTrip)
  | { readonly loop: 'share-join' };

export type LoopDeps = {
  readonly store: GrowthStore;
  // An open request of the person; undefined: none, or not open any more.
  readonly request: (id: string) => Promise<(Request & { readonly seats: number }) | undefined>;
  // A booked seat on a trip with free seats; undefined: none.
  readonly seat: (id: string) => Promise<Seat | undefined>;
  // The driver's trip with the seats it still takes; undefined: none.
  readonly trip: (id: string) => Promise<OwnTrip | undefined>;
  readonly loopMessage: (input: LoopInput) => Promise<CardMessage>;
  readonly links: {
    readonly requests: (request: Request, via: string) => string;
    readonly trip: (tripId: string, via: string) => string;
    // The start of the passenger bot: «Yana ulashish».
    readonly start: (via: string) => string;
  };
  readonly prepare: (
    side: Side,
    userId: number,
    message: CardMessage,
    link: string,
  ) => Promise<string | null>;
};

// Who asks: the bot of their app keeps the message (docs/43); photo: the public link of the picture of
// the trip (loop trip).
export type LoopAsk = {
  readonly userId: number;
  readonly side: Side;
  readonly card: LoopCard;
  readonly photo?: string;
};

async function inputOf(deps: LoopDeps, userId: number, card: LoopCard): Promise<LoopInput | null> {
  switch (card.loop) {
    case 'share-join':
      return { loop: card.loop };
    case 'trip': {
      const trip = await deps.trip(card.tripId);
      return trip?.driverId === userId && trip.seatsLeft > 0 ? { loop: card.loop, ...trip } : null;
    }
    case 'req-share': {
      const request = await deps.request(card.requestId);
      return request?.passengerId === userId ? { loop: card.loop, ...request } : null;
    }
    default: {
      const seat = await deps.seat(card.bookingId);
      return seat?.passengerId === userId && seat.seatsLeft > 0
        ? { loop: card.loop, ...seat, seats: seat.seatsLeft }
        : null;
    }
  }
}

function linkOf(deps: LoopDeps, input: LoopInput, via: string): string {
  if (input.loop === 'share-join') return deps.links.start(via);
  return input.loop === 'req-share' ? deps.links.requests(input, via) : deps.links.trip(input.tripId, via);
}

// The card of a loop with the mark of its loop and the code of the person (docs/116); only of the
// person's own request, seat or trip. null: nothing to share.
export async function loopCard(deps: LoopDeps, ask: LoopAsk): Promise<PreparedCard | null> {
  const input = await inputOf(deps, ask.userId, ask.card);
  if (!input) return null;
  const link = linkOf(deps, input, loopVia(input.loop, await deps.store.codeOf(ask.userId)));
  const message = { ...(await deps.loopMessage(input)), ...(ask.photo ? { photo: ask.photo } : {}) };
  const prepared = await deps.prepare(ask.side, ask.userId, message, link);
  return { prepared, link, text: message.text };
}
