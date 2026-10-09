import {
  DRIVER_DOCK_SECTIONS,
  DriverData,
  DriverDock,
  DriverGate,
  DriverHome,
  DriverNotice,
  DriverTiles,
  HomeRouteProvider,
  HomeScreenOffer,
  MyTripsScreen,
  NEW_TRIP_SECTION,
  NewTripFlow,
  RequestsFlow,
  StartFlow,
  useDriverTripsLive,
  useNotSent,
  useRequestsNearLive,
  WALLET_ACTION,
  type HomeGo,
  type StartAction,
} from '@platform/ui';

const NEW_TRIP: StartAction = {
  id: NEW_TRIP_SECTION,
  icon: 'more',
  tone: 'mint',
  labelKey: 'home.publish',
  hintKey: 'home.publishHint',
  waitsApproval: true,
  Screen: NewTripFlow,
};
const REQUESTS = {
  id: 'passenger_requests',
  labelKey: 'common.driver.passengerRequests',
  hintKey: 'common.driver.passengerRequestsHint',
  Screen: RequestsFlow,
} as const;
const MY_TRIPS = {
  id: 'my_trips',
  labelKey: 'common.myTrips',
  hintKey: 'common.driver.myTripsHint',
  Screen: MyTripsScreen,
} as const;

// Before the application is sent (mockup g62/1 screen 1): publishing and the requests wait pale.
const DRAFT_ACTIONS: readonly StartAction[] = [
  NEW_TRIP,
  { ...REQUESTS, icon: 'profile', tone: 'mint', paleUntilApproval: true },
  { ...MY_TRIPS, icon: 'adverts', tone: 'mint' },
];

// Then (mockup g66/2): the requests on the directions of the driver and the trips of the week.
// «Safar eʼlon qilish» is the main button under «Qayerdan / Qayerga».
const ACTIONS: readonly StartAction[] = [
  { ...REQUESTS, icon: 'passengers', tone: 'mint', useLive: useRequestsNearLive },
  { ...MY_TRIPS, icon: 'myTrips', tone: 'mint', useLive: useDriverTripsLive },
];
const SECTIONS: readonly StartAction[] = [NEW_TRIP, WALLET_ACTION, ...DRIVER_DOCK_SECTIONS];

// The main screen right after the registration: before sending, the big tile «Haydovchi boʻlish»;
// while it is checked, a note says what waits (G62, docs/118 path 5).
export function StartPage() {
  return (
    <DriverGate>
      <DriverStart />
    </DriverGate>
  );
}

// The same main screen as a passenger has (G66, docs/118): the profile, what is now, four tiles, at
// the bottom «Qayerdan / Qayerga» with «Safar eʼlon qilish». The tiles read the trips of the card.
function DriverStart() {
  const draft = useNotSent();
  return (
    <DriverData>
      <HomeRouteProvider>
        <StartFlow
          actions={draft ? DRAFT_ACTIONS : ACTIONS}
          notice={<DriverNotice />}
          after={<HomeScreenOffer />}
          home={(go) => <DriverHome go={go} />}
          tiles={(go, openProfile) => <DriverTiles go={go} openProfile={openProfile} />}
          sections={SECTIONS}
          {...(draft ? {} : { dock: (go: HomeGo) => <DriverDock go={go} /> })}
        />
      </HomeRouteProvider>
    </DriverData>
  );
}
