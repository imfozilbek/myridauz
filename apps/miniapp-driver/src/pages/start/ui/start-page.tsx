import {
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
  type StartAction,
} from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'home.publish',
    hintKey: 'home.publishHint',
    waitsApproval: true,
    Screen: NewTripFlow,
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    // On the check its own screen says why it waits; the tile is pale with its hint (G62).
    paleUntilApproval: true,
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

// The main screen right after the registration: before sending, the big tile «Haydovchi boʻlish»;
// while it is checked, a note says what waits (G62, docs/118 path 5).
export function StartPage() {
  return (
    <DriverGate>
      <DriverStart />
    </DriverGate>
  );
}

// An approved driver publishes from the big tile on top (G62, mockup g62/1 screen 6); until the
// application is approved the tile waits pale in the grid. The tiles read the trips of the block above.
function DriverStart() {
  const pending = usePending();
  return (
    <DriverData>
      <StartFlow
        actions={ACTIONS}
        notice={<DriverNotice />}
        after={<HomeScreenOffer />}
        home={(go) => <DriverHome go={go} />}
        tiles={() => <DriverTiles />}
        {...(pending ? {} : { mainTile: 'new_trip' })}
      />
    </DriverData>
  );
}
