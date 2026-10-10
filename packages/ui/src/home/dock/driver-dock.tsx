import { useState } from 'react';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import { approvalSeen } from '../../driver/approval-seen';
import { useDriver } from '../../driver/driver-context';
import type { HomeGo } from '../../flow/start-action';
import { PlacesKnown } from '../../market/places-gate';
import { useLoad } from '../../market/use-list';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { useDirectory } from '../../places/use-directory';
import { ActionFailure } from '../../states/action-failure';
import { useDriverData } from '../driver-data';
import { DockPanel } from './dock-panel';
import { useDockWords } from './dock-words';
import { DriverAppCard } from './driver-app-cards';
import { DepartCard, PointCard, RoadCard } from './driver-day-cards';
import { DriverIdle } from './driver-idle';
import { driverStates, type DriverState } from './driver-state';
import { AcceptedCard, EndedCard, PublishedCard, RequestsCard } from './driver-trip-cards';
import { unseenOffers } from './offer-seen';
import { useTripActions } from './trip-actions';

// The block at the bottom of a driver (G76, docs/165, mockup g76/3): the application, the money, the
// trip of now with its buttons, else «Qayerdan / Qayerga». The clock moves it on an open screen.
export function DriverDock({ go }: { readonly go: HomeGo }) {
  const state = useDriverState();
  const [places] = useDirectory();
  const directory = places.status === 'ready' ? places.directory : null;
  // The application needs no places: it shows at once (G62, mockup g76/3 states 1 and 3).
  if (state.kind === 'draft' || state.kind === 'fix')
    return (
      <DockPanel>
        <ApplicationCard kind={state.kind} go={go} />
      </DockPanel>
    );
  if (state.kind === 'idle' || state.kind === 'pending' || !directory)
    return (
      <DockPanel>
        <DriverIdle go={go} directory={directory} />
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

export function useDriverState(): DriverState {
  const { value } = useDriverData();
  const { wallet } = useApiClients();
  const status = useDriver()?.application.status ?? 'draft';
  const money = useLoad(() => wallet.mine(), 'wallet').value;
  const now = useNow();
  const { schedule, wallet: rules } = useBrand();
  // «Siz haydovchisiz!» stays for this visit, though it is marked seen at once (G62).
  const [welcome] = useState(() => !approvalSeen());
  const [trips, bookings] = value ?? [[], []];
  const lists = {
    status,
    welcome,
    trips,
    bookings,
    wallet: money ?? null,
    fewSeats: rules.fewSeats,
    unseen: unseenOffers(bookings, now),
  };
  const [first] = driverStates(lists, now, schedule.meetMinutes);
  return first ?? { kind: 'idle' };
}

function ApplicationCard({ kind, go }: { readonly kind: 'draft' | 'fix'; readonly go: HomeGo }) {
  const act = useTripActions(go, null, () => undefined);
  return <DriverAppCard kind={kind} wallet={null} missing={0} requests={[]} act={act} go={go} />;
}

type CardProps = { readonly state: DriverState; readonly go: HomeGo; readonly directory: PlaceDirectory };

function Card({ state, go, directory }: CardProps) {
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
        return <RoadCard trip={state.trip} people={people} onChanged={changed} />;
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
