import { useState } from 'react';
import { usePending } from '../driver/driver-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { DateStep } from './date-step';
import { NewTripFlow } from './new-trip-flow';
import { PendingLock } from './pending-lock';
import { PlacesGate } from './places-gate';
import { RequestsDay } from './requests-day';
import { today } from './when';

type FlowProps = {
  readonly onBack: () => void;
  // A bot link names the route and the day: the requests open at once (docs/83 N08).
  readonly initial?: { readonly route: Route; readonly date: string };
};

// A trip goes between districts: a whole region of the search is asked again in the trip.
const tripRoute = (route: Route) =>
  route.from.type === 'region' || route.to.type === 'region' ? {} : { route };

// A driver looks for passengers on a route (docs/09): the route, then the requests of today with
// the day on the same screen (G37, docs/101 R2); an empty day leads to a new trip (R4).
export function RequestsSearchFlow({ onBack, initial }: FlowProps) {
  const [now] = useState(Date.now);
  const [route, setRoute] = useState<Route | null>(initial?.route ?? null);
  // Back from the requests, the route chosen before stays on the screen (docs/94 F8).
  const [picking, setPicking] = useState(!initial);
  const [date, setDate] = useState(initial?.date ?? today(now));
  const [calendar, setCalendar] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const pending = usePending();
  if (pending) return <PendingLock onBack={onBack} />;
  if (picking || !route) {
    const done = (value: Route) => {
      setRoute(value);
      setPicking(false);
    };
    return (
      <RouteScreen allowWholeRegion quick {...(route ? { initial: route } : {})} onBack={onBack} onDone={done} />
    );
  }
  if (publishing)
    return <NewTripFlow {...tripRoute(route)} date={date} onBack={() => setPublishing(false)} />;
  if (calendar) {
    const chosen = (value: string) => {
      setDate(value);
      setCalendar(false);
    };
    return <DateStep calendar now={now} initial={date} onBack={() => setCalendar(false)} onDone={chosen} />;
  }
  return (
    <PlacesGate onBack={() => setPicking(true)}>
      <RequestsDay
        key={date}
        route={route}
        date={date}
        now={now}
        onDay={setDate}
        onOtherDay={() => setCalendar(true)}
        onPublish={() => setPublishing(true)}
        onBack={() => setPicking(true)}
      />
    </PlacesGate>
  );
}
