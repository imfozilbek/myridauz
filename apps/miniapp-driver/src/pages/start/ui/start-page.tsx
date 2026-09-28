import { StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'new_trip',
    icon: 'newTrip',
    tone: 'brand',
    labelKey: 'common.driver.newTrip',
    hintKey: 'common.driver.newTripHint',
  },
  {
    id: 'passenger_requests',
    icon: 'passengers',
    tone: 'accent',
    labelKey: 'common.driver.passengerRequests',
    hintKey: 'common.driver.passengerRequestsHint',
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.driver.myTripsHint',
  },
];

export function StartPage() {
  return <StartFlow actions={ACTIONS} />;
}
