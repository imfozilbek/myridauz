import {
  DriverGate,
  MyTripsScreen,
  NewTripFlow,
  PendingNotice,
  RequestsSearchFlow,
  StartFlow,
  type StartAction,
} from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'common.driver.newTrip',
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
      <StartFlow actions={ACTIONS} notice={<PendingNotice />} />
    </DriverGate>
  );
}
