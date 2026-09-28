import { StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  { id: 'find_trip', icon: 'search', labelKey: 'common.passenger.findTrip' },
  { id: 'leave_request', icon: 'request', labelKey: 'common.passenger.leaveRequest' },
  { id: 'my_trips', icon: 'myTrips', labelKey: 'common.myTrips' },
];

export function StartPage() {
  return <StartFlow welcomeIcon="trip" welcome="common.passenger.welcome" actions={ACTIONS} />;
}
