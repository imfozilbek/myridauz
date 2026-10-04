import {
  FindTripFlow,
  MyRequestsScreen,
  NewRequestFlow,
  PassengerData,
  PassengerHome,
  PassengerTiles,
  StartFlow,
  useBookingsLive,
  useOffersLive,
  type StartAction,
} from '@platform/ui';

// The main screen has at most 3 actions (docs/19).
const ACTIONS: readonly StartAction[] = [
  {
    id: 'find_trip',
    icon: 'search',
    tone: 'brand',
    labelKey: 'common.passenger.findTrip',
    hintKey: 'common.passenger.findTripHint',
    Screen: FindTripFlow,
  },
  {
    id: 'leave_request',
    icon: 'request',
    tone: 'accent',
    labelKey: 'common.passenger.leaveRequest',
    hintKey: 'common.passenger.leaveRequestHint',
    // The tile counts the offers of drivers waiting for an answer (G53).
    useLive: useOffersLive,
    Screen: NewRequestFlow,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
    useLive: useBookingsLive,
    Screen: MyRequestsScreen,
  },
];

export function StartPage() {
  // «Safar topish» is the main button of the main screen: the list does not repeat it (G25).
  // The tiles read the same bookings, requests and offers as the block above them (G53).
  return (
    <PassengerData>
      <StartFlow
        actions={ACTIONS}
        covered="find_trip"
        home={(go) => <PassengerHome go={go} />}
        tiles={(go, openProfile) => <PassengerTiles go={go} openProfile={openProfile} />}
      />
    </PassengerData>
  );
}
