import { StartFlow, type StartAction } from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'find_trip',
    icon: 'search',
    tone: 'brand',
    labelKey: 'common.passenger.findTrip',
    hintKey: 'common.passenger.findTripHint',
  },
  {
    id: 'leave_request',
    icon: 'request',
    tone: 'accent',
    labelKey: 'common.passenger.leaveRequest',
    hintKey: 'common.passenger.leaveRequestHint',
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
  },
];

export function StartPage() {
  return <StartFlow welcomeIcon="search" welcome="common.passenger.welcome" actions={ACTIONS} />;
}
