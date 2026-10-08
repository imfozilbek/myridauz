import { MY_TRIP_LINK, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { DraftRestored } from '../flow/draft-restored';
import { useGoHome } from '../flow/home-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { MyTripsScreen } from './my-trips-screen';
import { useNewTrip } from './new-trip-state';
import { PlacesGate } from './places-gate';
import { TripLimitScreen, useTripLimitReached } from './trip-limit';
import type { TripAgain } from './trip-draft';
import { TripOnRoute } from './trip-on-route';

type NewTripFlowProps = {
  readonly onBack: () => void;
  readonly route?: Route;
  // The day of the requests the driver looked at: the trip opens on it (G37, docs/101 R4).
  readonly date?: string;
  // «Oxirgi yoʻnalish»: the answers of the last trip, the day is the first free one (G40, docs/106 K3).
  readonly again?: TripAgain;
};

// A new trip on one screen (G63, docs/118 path 6): the route first when it is not known, then
// «Safar eʼlon qilish» with every answer; published, «Mening safarim» of the new trip opens at once.
// A closed app comes back to the same screen with its answers (docs/94 F3).
export function NewTripFlow(props: NewTripFlowProps) {
  const flow = useNewTrip(props.route, props.date, props.again);
  const limitReached = useTripLimitReached();
  const home = useGoHome(props.onBack);
  const [published, setPublished] = useState<string | null>(null);
  if (published) return <MyTripsScreen onBack={home} link={{ name: MY_TRIP_LINK, id: published }} />;
  if (limitReached) return <TripLimitScreen onBack={props.onBack} />;
  const done = (trip: Trip) => {
    flow.clear();
    setPublished(trip.id);
  };
  return (
    <>
      <TripRoute flow={flow} known={props.route !== undefined} onBack={props.onBack} onPublished={done} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}

type RouteProps = {
  readonly flow: ReturnType<typeof useNewTrip>;
  // The route came with the flow: «Назад» from the trip leaves, else it goes back to the route.
  readonly known: boolean;
  readonly onBack: () => void;
  readonly onPublished: (trip: Trip) => void;
};

// The route by lists, all of it or one end from «Oʻzgartirish» (G26, docs/74), then the trip on it.
function TripRoute({ flow, known, onBack, onPublished }: RouteProps) {
  const { screen, answer, open, back, reroute } = flow;
  const { route } = answer;
  const end = screen === 'from' || screen === 'to' ? screen : null;
  if (!route || screen === 'route' || end)
    return (
      <RouteScreen
        allowWholeRegion={false}
        quick
        {...(route ? { initial: route } : {})}
        {...(route && end ? { pick: end } : {})}
        onBack={route && end ? () => back() : onBack}
        onDone={reroute}
      />
    );
  const leave = known ? onBack : () => open('route');
  return (
    <PlacesGate onBack={leave}>
      <TripOnRoute flow={flow} route={route} onBack={leave} onPublished={onPublished} />
    </PlacesGate>
  );
}
