import type { RequestBoard, RequestBoardQuery } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useLoad } from '../market/use-list';

// A new day or route shows the board of before until its own comes: no skeleton between (G41).
const BOARD = 'requests.board';

type Board = { readonly board: RequestBoard; readonly offered: ReadonlySet<string> };

// The board of requests of a driver (G64, docs/118 path 7) with the requests the driver already
// offered on: a second offer is not asked (G41, docs/90 F-D1). Fresh on every signal of the feed.
export function useBoard(query: RequestBoardQuery) {
  const { market, bookings } = useApiClients();
  return useLoad(async (): Promise<Board> => {
    // The screen itself: the requests on it count as seen by the driver (G76, «N haydovchi koʻrdi»).
    const seen = market.requestBoard({ ...query, seen: '1' });
    const [board, offers] = await Promise.all([seen, bookings.driverOffers()]);
    const offered = new Set(
      offers.filter((offer) => offer.status === 'sent').map((offer) => offer.requestId),
    );
    return { board, offered };
  }, BOARD);
}
