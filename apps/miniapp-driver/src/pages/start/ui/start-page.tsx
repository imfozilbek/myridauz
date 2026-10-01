import {
  DriverGate,
  DriverHome,
  MyTripsScreen,
  NewTripFlow,
  PendingNotice,
  RequestsSearchFlow,
  StartFlow,
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
    hintKey: 'common.driver.newTripHint',
    Screen: NewTripFlow,
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    Screen: RequestsSearchFlow,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
    Screen: MyTripsScreen,
  },
];

// The main screen after the application is sent; while it is checked a note says what waits (docs/04).
export function StartPage() {
  return (
    <DriverGate>
      <DriverStart />
    </DriverGate>
  );
}

// An approved driver publishes from the main button, so the list does not repeat «Yangi safar»;
// while the application is checked there is no main button and the action stays (G25).
function DriverStart() {
  const pending = usePending();
  return (
    <StartFlow
      actions={ACTIONS}
      notice={<PendingNotice />}
      home={(go) => <DriverHome go={go} />}
      {...(pending ? {} : { covered: 'new_trip' })}
    />
  );
}
