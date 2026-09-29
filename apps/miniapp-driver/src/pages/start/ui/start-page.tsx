import {
  DriverGate,
  MyTripsScreen,
  NewTripFlow,
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

// Only an approved driver sees the main screen; before that the application (docs/04, G06).
export function StartPage() {
  return (
    <DriverGate>
      <StartFlow actions={ACTIONS} />
    </DriverGate>
  );
}
