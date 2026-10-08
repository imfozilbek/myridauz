import { MY_TRIP_LINK, type RequestBoardQuery } from '@platform/contracts';
import { useState } from 'react';
import { NotEnoughScreen, TopUpScreen } from '../bookings/wallet-steps';
import { ChatScreen } from '../chat/chat-screen';
import { usePending } from '../driver/driver-context';
import { MyTripsScreen } from '../market/my-trips-screen';
import { NewTripFlow } from '../market/new-trip-flow';
import { PendingLock } from '../market/pending-lock';
import { PlacesGate } from '../market/places-gate';
import type { Route } from '../places/route-screen';
import { BoardScreen } from './board-screen';

type Props = {
  readonly onBack: () => void;
  // A bot link names the route and the day: the requests open at once (docs/83 N08).
  readonly initial?: RequestBoardQuery;
};

type Over =
  | { readonly screen: 'chat'; readonly chatKey: string; readonly ring: boolean }
  | { readonly screen: 'short' | 'topUp'; readonly commission: number }
  | { readonly screen: 'trip'; readonly tripId: string }
  | { readonly screen: 'publish'; readonly date: string };

// A trip goes between districts: a whole region of the board is asked again in the trip (G37 R4).
const tripRoute = (route: Route | null) =>
  !route || route.from.type === 'region' || route.to.type === 'region' ? {} : { route };

// «Yoʻlovchilar soʻrovlari» of a driver (G64, docs/118 path 7): the board, and from it the talk
// before a booking (numbers hidden, docs/07), the wallet when it holds too little, the trip opened
// for a whole car, a new trip on an empty day. «Назад» comes back to the board.
export function RequestsFlow({ onBack, initial }: Props) {
  const [query, setQuery] = useState<RequestBoardQuery>(initial ?? {});
  const [over, setOver] = useState<Over | null>(null);
  // The route chosen for the board: an empty day publishes a trip on it.
  const [route, setRoute] = useState<Route | null>(null);
  const pending = usePending();
  const close = () => setOver(null);
  if (pending) return <PendingLock onBack={onBack} />;
  if (over?.screen === 'chat') return <ChatScreen chatKey={over.chatKey} ring={over.ring} onBack={close} />;
  if (over?.screen === 'trip')
    return <MyTripsScreen onBack={close} link={{ name: MY_TRIP_LINK, id: over.tripId }} />;
  if (over?.screen === 'publish')
    return <NewTripFlow {...tripRoute(route)} date={over.date} onBack={close} />;
  if (over?.screen === 'topUp')
    return <TopUpScreen onBack={() => setOver({ screen: 'short', commission: over.commission })} />;
  if (over?.screen === 'short')
    return (
      <NotEnoughScreen
        amount={over.commission}
        onBack={close}
        onTopUp={() => setOver({ screen: 'topUp', commission: over.commission })}
      />
    );
  return (
    <PlacesGate onBack={onBack}>
      <BoardScreen
        key={JSON.stringify(query)}
        query={query}
        onDay={(date) => setQuery({ ...query, date })}
        onRoute={(chosen) => {
          setRoute(chosen);
          setQuery({ from: chosen.from.id, to: chosen.to.id });
        }}
        onTalk={(chatKey, ring) => setOver({ screen: 'chat', chatKey, ring })}
        onShort={(commission) => setOver({ screen: 'short', commission })}
        onTrip={(tripId) => setOver({ screen: 'trip', tripId })}
        onPublish={(date) => setOver({ screen: 'publish', date })}
        onBack={onBack}
      />
    </PlacesGate>
  );
}
