import { DriverGate, StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'common.driver.newTrip',
    hintKey: 'common.driver.newTripHint',
    route: { wholeRegion: false },
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
    route: { wholeRegion: true },
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
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
