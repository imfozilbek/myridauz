import {
  DRIVER_DOCK_SECTIONS,
  DRIVER_TILE_SECTIONS,
  DriverData,
  DriverDock,
  DriverGate,
  DriverHome,
  DriverSide,
  DriverTiles,
  HomeRouteProvider,
  MyTripsScreen,
  NEW_TRIP_SECTION,
  NewTripFlow,
  RequestsFlow,
  StartFlow,
  WALLET_ACTION,
  type StartAction,
} from '@platform/ui';

// The sections the block and the tiles open (G76, docs/165): none of them is drawn as a tile.
const SECTIONS: readonly StartAction[] = [
  {
    id: NEW_TRIP_SECTION,
    icon: 'more',
    tone: 'mint',
    labelKey: 'home.publish',
    hintKey: 'home.publishHint',
    Screen: NewTripFlow,
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'mint',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    Screen: RequestsFlow,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'mint',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
    Screen: MyTripsScreen,
  },
  WALLET_ACTION,
  ...DRIVER_DOCK_SECTIONS,
  ...DRIVER_TILE_SECTIONS,
];

// The main screen right after the registration (G62, docs/118 path 5).
export function StartPage() {
  return (
    <DriverGate>
      <DriverStart />
    </DriverGate>
  );
}

// The main screen of a driver (G76, docs/165, mockup g76/3): the head with the car, four tiles, the
// block at the bottom that leads from the application to the trip of today.
function DriverStart() {
  return (
    <DriverData>
      <HomeRouteProvider>
        <StartFlow
          actions={[]}
          home={() => <DriverHome />}
          tiles={(go) => <DriverTiles go={go} />}
          side={(openProfile) => <DriverSide openProfile={openProfile} />}
          sections={SECTIONS}
          dock={(go) => <DriverDock go={go} />}
        />
      </HomeRouteProvider>
    </DriverData>
  );
}
