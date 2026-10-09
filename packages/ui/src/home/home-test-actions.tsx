import { NEW_TRIP_SECTION, type AppLink } from '@platform/contracts';
import type { Launch, StartAction } from '../flow/start-action';
import { FindTripFlow } from '../market/find-trip-flow';
import { useDriverTripsLive, useRequestsNearLive } from './driver-live';
import { useBookingsLive } from './passenger-data';
import { useRequestLive } from './request-live';

// The actions of the main screens in tests, as the apps have them (G25, G66).
type Opened = { readonly onBack: () => void } & Launch;
// A section shows what the main screen gave it: the link, the route, the end to choose.
function Shown({ link, route, pick }: Opened) {
  const what = link
    ? `${link.name}:${link.id}`
    : route
      ? `${route.from.name}>${route.to.name}`
      : (pick ?? 'empty');
  return <p>{`opened ${what}`}</p>;
}
const action = (
  id: string,
  labelKey: StartAction['labelKey'],
  more: Partial<StartAction> = {},
): StartAction => ({
  id,
  icon: 'trip',
  tone: 'brand',
  labelKey,
  hintKey: 'common.passenger.myTripsHint',
  Screen: Shown,
  ...more,
});
export const PASSENGER_ACTIONS: readonly StartAction[] = [
  action('find_trip', 'common.passenger.findTrip', { Screen: FindTripFlow }),
  action('leave_request', 'common.passenger.leaveRequest', { useLive: useRequestLive }),
  action('my_trips', 'common.myTrips', { useLive: useBookingsLive }),
];
// Publishing is the button of the block at the bottom, never a tile (G66, mockup g66/2).
export const NEW_TRIP = action(NEW_TRIP_SECTION, 'home.publish', { waitsApproval: true });
const REQUESTS = action('passenger_requests', 'common.driver.passengerRequests', {
  hintKey: 'common.driver.passengerRequestsHint',
});
const MY_TRIPS = action('my_trips', 'common.myTrips', { hintKey: 'common.driver.myTripsHint' });
export const DRIVER_ACTIONS: readonly StartAction[] = [
  { ...REQUESTS, useLive: useRequestsNearLive },
  { ...MY_TRIPS, useLive: useDriverTripsLive },
];
// Before the application is sent (mockup g62/1 screen 1).
export const DRAFT_ACTIONS: readonly StartAction[] = [
  NEW_TRIP,
  { ...REQUESTS, paleUntilApproval: true },
  MY_TRIPS,
];

export const linkOf = (link: AppLink) => `opened ${link.name}:${link.id}`;
