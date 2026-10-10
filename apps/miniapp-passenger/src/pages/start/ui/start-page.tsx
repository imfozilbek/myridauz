import {
  BecomeDriver,
  FindTripFlow,
  HomeRouteProvider,
  MyRequestsScreen,
  NewRequestFlow,
  PASSENGER_SECTIONS,
  PASSENGER_TILE_SECTIONS,
  PassengerSide,
  PassengerData,
  PassengerDock,
  PassengerHome,
  PassengerTiles,
  StartFlow,
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
    Screen: NewRequestFlow,
  },
  {
    id: 'my_trips',
    icon: 'myTrips',
    tone: 'deep',
    labelKey: 'common.myTrips',
    hintKey: 'common.passenger.myTripsHint',
    Screen: MyRequestsScreen,
  },
];

export function StartPage() {
  // «Safar topish» is the main button of the main screen: the list does not repeat it (G25).
  // The tiles read the same bookings, requests and offers as the block above them (G53).
  // At the bottom «Qayerdan / Qayerga» with «Safar topish»; the picks come back to it (G66, g66/1).
  // Under the tiles «Haydovchi boʻling» opens the app of drivers.
  return (
    <PassengerData>
      <HomeRouteProvider>
        <StartFlow
          actions={ACTIONS}
          covered="find_trip"
          home={(go) => <PassengerHome go={go} />}
          tiles={(go) => <PassengerTiles go={go} />}
          side={(openProfile) => <PassengerSide openProfile={openProfile} />}
          after={<BecomeDriver />}
          dock={(go) => <PassengerDock go={go} />}
          sections={[...PASSENGER_SECTIONS, ...PASSENGER_TILE_SECTIONS]}
        />
      </HomeRouteProvider>
    </PassengerData>
  );
}
