import {
  DriverApproved,
  DriverData,
  DriverGate,
  DriverHome,
  DriverNotice,
  DriverTiles,
  HomeScreenOffer,
  MyTripsScreen,
  NewTripFlow,
  RequestsSearchFlow,
  StartFlow,
  useDriverTripsLive,
  usePending,
  WALLET_SECTION,
  WalletScreen,
  type StartAction,
} from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'home.publish',
    hintKey: 'common.driver.newTripHint',
    waitsApproval: true,
    Screen: NewTripFlow,
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    // On the check its own screen says why it waits; the tile keeps its hint (the mockup of G53).
    Screen: RequestsSearchFlow,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
    // The tile counts the new requests of passengers on the live trips (G53).
    useLive: useDriverTripsLive,
    Screen: MyTripsScreen,
  },
];

// «Hamyon» opens from its tile once the application is approved (G53).
const SECTIONS: readonly StartAction[] = [
  {
    id: WALLET_SECTION,
    icon: 'wallet',
    tone: 'deep',
    labelKey: 'wallet.title',
    hintKey: 'wallet.rule',
    Screen: WalletScreen,
  },
];

// The main screen right after the registration (G34): before sending, the card of the application;
// while it is checked, a note says what waits (docs/04).
export function StartPage() {
  return (
    <DriverGate>
      <DriverStart />
    </DriverGate>
  );
}

// An approved driver publishes from the main button and its tile (G25, G53); until the
// application is approved there is no main button. The tiles read the trips of the block above.
function DriverStart() {
  const pending = usePending();
  return (
    <DriverData>
      <StartFlow
        actions={ACTIONS}
        sections={SECTIONS}
        coveredTile
        notice={<DriverNotice />}
        after={
          <>
            <DriverApproved />
            <HomeScreenOffer />
          </>
        }
        home={(go) => <DriverHome go={go} />}
        tiles={(go) => <DriverTiles go={go} />}
        {...(pending ? {} : { covered: 'new_trip' })}
      />
    </DriverData>
  );
}
