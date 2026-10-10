import { useApiClients } from '../../context/api-clients';
import type { HomeGo } from '../../flow/start-action';
import { useLoad } from '../../market/use-list';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { ActionFailure } from '../../states/action-failure';
import { useDriverData } from '../driver-data';
import { useDockWords } from './dock-words';
import { DriverAppCard } from './driver-app-cards';
import { DepartCard, PointCard } from './driver-day-cards';
import { RoadCard } from './driver-road-card';
import type { DriverState } from './driver-state';
import { AcceptedCard, EndedCard, PublishedCard, RequestsCard } from './driver-trip-cards';
import { useTripActions } from './trip-actions';

type CardProps = { readonly state: DriverState; readonly go: HomeGo; readonly directory: PlaceDirectory };

// The card of a driver's state with its buttons (G76, mockup g76/3).
export function DriverStateCard({ state, go, directory }: CardProps) {
  const { value, refresh } = useDriverData();
  const { wallet } = useApiClients();
  const money = useLoad(() => wallet.mine(), 'wallet').value ?? null;
  const now = useNow();
  const words = useDockWords(directory, now);
  const changed = () => void refresh();
  const act = useTripActions(go, directory, changed);
  const bookings = value?.[1] ?? [];
  const people = 'trip' in state ? bookings.filter((booking) => booking.trip.id === state.trip.id) : [];
  const common = { words, act, go };
  const card = (() => {
    switch (state.kind) {
      case 'welcome':
      case 'low':
        return <DriverAppCard kind={state.kind} wallet={money} missing={0} requests={[]} act={act} go={go} />;
      case 'short':
        return (
          <DriverAppCard
            kind="short"
            wallet={money}
            missing={state.missing}
            requests={state.requests}
            act={act}
            go={go}
          />
        );
      case 'published':
        return <PublishedCard trip={state.trip} people={people} {...common} />;
      case 'requests':
        return <RequestsCard trip={state.trip} people={people} {...common} />;
      case 'accepted':
        return <AcceptedCard trip={state.trip} booking={state.booking} {...common} />;
      case 'ended':
        return <EndedCard trip={state.trip} people={people} {...common} />;
      case 'depart':
      case 'departAsk':
        return (
          <DepartCard
            trip={state.trip}
            people={people}
            words={words}
            act={act}
            onChanged={changed}
            late={state.kind === 'departAsk'}
          />
        );
      case 'passengerWaits':
      case 'atPoint':
        return (
          <PointCard
            booking={state.booking}
            words={words}
            act={act}
            waiting={state.kind === 'passengerWaits'}
          />
        );
      case 'onRoad':
        return <RoadCard trip={state.trip} people={people} act={act} onChanged={changed} />;
      case 'idle':
      case 'pending':
      case 'draft':
      case 'fix':
        return null;
    }
  })();
  return (
    <>
      {card}
      <ActionFailure error={act.failure} />
    </>
  );
}
