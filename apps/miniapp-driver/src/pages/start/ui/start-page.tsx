import { StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  { id: 'new_trip', icon: 'newTrip', labelKey: 'common.driver.newTrip' },
  { id: 'passenger_requests', icon: 'passengers', labelKey: 'common.driver.passengerRequests' },
  { id: 'my_trips', icon: 'myTrips', labelKey: 'common.myTrips' },
];

export function StartPage() {
  return <StartFlow welcomeIcon="newTrip" welcome="common.driver.welcome" actions={ACTIONS} />;
}
