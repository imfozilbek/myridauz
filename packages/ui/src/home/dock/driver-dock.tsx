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
import { useDriverData } from '../driver-data';
import { driverCue } from './cues';
import { DockFailed } from './dock-failed';
import { DockPanel } from './dock-panel';
import { DriverAppCard } from './driver-app-cards';
import { DriverIdle } from './driver-idle';
import { DRIVER_LEVEL, driverStates, type DriverState } from './driver-state';
import { DriverStateCard } from './driver-state-card';
import { unseenOffers } from './offer-seen';
import { useTripActions } from './trip-actions';
import { useAttention } from './use-attention';

// The block at the bottom of a driver (G76, docs/165, mockup g76/3): the application, the money, the
// trip of now with its buttons, else «Qayerdan / Qayerga». The clock moves it on an open screen.
export function DriverDock({ go }: { readonly go: HomeGo }) {
  const state = useDriverState();
  const load = useDriverData();
  const [places, retryPlaces] = useDirectory();
  const directory = places.status === 'ready' ? places.directory : null;
  const cue = driverCue(state.kind);
  const target = 'booking' in state ? state.booking : 'trip' in state ? state.trip : null;
  const id = `${state.kind}:${target?.id ?? ''}`;
  const calls = useAttention({ id, level: DRIVER_LEVEL[state.kind], loud: cue !== null });
  return (
    <DockPanel cue={cue} calls={calls}>
      {state.kind === 'idle' || state.kind === 'pending' || !directory ? (
        <DockFailed load={load} places={places} retryPlaces={retryPlaces} />
      ) : null}
      <DriverBody state={state} go={go} directory={directory} />
    </DockPanel>
  );
}

type BodyProps = {
  readonly state: DriverState;
  readonly go: HomeGo;
  readonly directory: PlaceDirectory | null;
};

function DriverBody({ state, go, directory }: BodyProps) {
  // The application needs no places: it shows at once (G62, mockup g76/3 states 1 and 3).
  if (state.kind === 'draft' || state.kind === 'fix') return <ApplicationCard kind={state.kind} go={go} />;
  if (state.kind === 'idle' || state.kind === 'pending' || !directory)
    return <DriverIdle go={go} directory={directory} />;
  return (
    <PlacesKnown directory={directory}>
      <DriverStateCard state={state} go={go} directory={directory} />
    </PlacesKnown>
  );
}

function useDriverState(): DriverState {
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
