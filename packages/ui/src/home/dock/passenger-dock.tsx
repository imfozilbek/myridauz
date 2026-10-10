import type { Trip } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import type { HomeGo } from '../../flow/start-action';
import { PlacesKnown } from '../../market/places-gate';
import { useLoad } from '../../market/use-list';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { useDirectory } from '../../places/use-directory';
import { ActionFailure } from '../../states/action-failure';
import { usePassengerData } from '../passenger-data';
import { DockFailed } from './dock-failed';
import { DockPanel } from './dock-panel';
import { useDockWords } from './dock-words';
import { PassengerDayCard } from './passenger-day-cards';
import { PassengerIdle } from './passenger-idle';
import { usePassengerMarks } from './passenger-marks';
import { PassengerPlanCard } from './passenger-plan-cards';
import { PassengerSeatCard } from './passenger-seat-cards';
import { passengerState, passengerStates, type PassengerState } from './passenger-state';
import { useSeatActions } from './seat-actions';

// The block at the bottom of a passenger (G76, docs/165, mockup g76/2): the most important thing
// of now with its buttons, else «Qayerdan / Qayerga». The clock moves it on an open screen.
export function PassengerDock({ go }: { readonly go: HomeGo }) {
  const state = usePassengerState();
  const load = usePassengerData();
  const [places, retryPlaces] = useDirectory();
  const directory = places.status === 'ready' ? places.directory : null;
  if (state.kind === 'idle' || !directory)
    return (
      <DockPanel>
        <DockFailed load={load} places={places} retryPlaces={retryPlaces} />
        <PassengerIdle go={go} directory={directory} />
      </DockPanel>
    );
  return (
    <PlacesKnown directory={directory}>
      <DockPanel>
        <Card state={state} go={go} directory={directory} />
      </DockPanel>
    </PlacesKnown>
  );
}

// The state of now, also for the strip «Haydovchi boʻling» and the tiles (docs/165).
export function usePassengerState(): PassengerState {
  const { value } = usePassengerData();
  const now = useNow();
  const marks = usePassengerMarks();
  const { meetMinutes } = useBrand().schedule;
  const favorite = useFavoriteTrip(now, marks.seen);
  if (!value) return { kind: 'idle' };
  const [bookings, requests, offers] = value;
  const booked = new Set(bookings.map((booking) => booking.trip.id));
  const lists = {
    bookings,
    requests,
    offers,
    favorite: favorite && !booked.has(favorite.id) ? favorite : null,
  };
  return passengerState(passengerStates(lists, now, meetMinutes, marks));
}

// The first trip of a saved driver with seats, not shown on this phone yet (docs/129).
function useFavoriteTrip(now: number, seen: ReadonlySet<string>): Trip | null {
  const { comfort } = useApiClients();
  const { value } = useLoad(() => comfort.favorites(), 'favorites');
  return value?.trips.find((trip) => trip.seatsLeft > 0 && trip.departAt > now && !seen.has(trip.id)) ?? null;
}

type CardProps = { readonly state: PassengerState; readonly go: HomeGo; readonly directory: PlaceDirectory };

function Card({ state, go, directory }: CardProps) {
  const { refresh } = usePassengerData();
  const now = useNow();
  const words = useDockWords(directory, now);
  const act = useSeatActions(go, () => void refresh());
  const failure = <ActionFailure error={act.failure} />;
  switch (state.kind) {
    case 'driverWaits':
    case 'meeting':
    case 'onRoad':
    case 'arrivedAsk':
      return (
        <>
          <PassengerDayCard
            kind={state.kind}
            booking={state.booking}
            words={words}
            act={act}
            onTold={() => void refresh()}
          />
          {failure}
        </>
      );
    case 'request':
    case 'offers':
    case 'favorite':
      return <PassengerPlanCard plan={state} words={words} go={go} now={now} />;
    case 'idle':
      return null;
    default:
      return (
        <>
          <PassengerSeatCard
            kind={state.kind}
            booking={state.booking}
            words={words}
            act={act}
            go={go}
            directory={directory}
          />
          {failure}
        </>
      );
  }
}
