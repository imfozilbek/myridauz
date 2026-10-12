import type { Booking, Trip } from '@platform/contracts';
import { stopsInOrder, type Stop } from '../bookings/driver-stops';
import { useI18n } from '../context/i18n-context';
import { meetStep } from '../meeting/meet-state';
import { useNameText } from '../way/way-end';

// On the road (state 14): the next point and who is there, the same on the block of the main screen
// and on «Mening safarim» (G78 В2). The points to pick up come first with «Men keldim» (G77, docs/170
// О1), then the dropoffs (docs/124 В).
export function useRoadNext(trip: Trip, people: readonly Booking[]) {
  const { t } = useI18n();
  const nameText = useNameText();
  const riders = people.filter((booking) => booking.status === 'confirmed' || booking.status === 'completed');
  const done = riders.filter((booking) => booking.arrivedAt !== null).length;
  const { pickups, dropoffs } = stopsInOrder(riders, null);
  // Who the driver has not come to yet at a point (docs/126).
  const waiting = (stop: Stop) => stop.riders.filter((one) => meetStep(one) === 'come');
  const pickup = pickups.find((stop) => waiting(stop).length > 0);
  const stops = pickup ? pickups.filter((stop) => waiting(stop).length > 0) : dropoffs;
  const next = pickup ?? stops.find((stop) => stop.riders.some((booking) => booking.arrivedAt === null));
  const here = pickup ? waiting(pickup) : (next?.riders ?? []);
  return {
    chip: t('home.dock.onRoadOf', {
      title: t('driverTrip.onWay.title'),
      done: String(done),
      all: String(riders.length),
    }),
    place: next?.name ? nameText(next.name, pickup ? trip.from : trip.to) : (next?.who ?? ''),
    // At a pitak the place is its name: under it who waits there, as on the card of the stop.
    who: pickup ? here.map((one) => one.passenger.firstName).join(', ') : (next?.who ?? ''),
    seats: here.reduce((sum, booking) => sum + booking.seats, 0),
    next,
    // The people the driver came to with «Men keldim»: none once the pickups are over.
    came: pickup ? here : [],
    stops,
  };
}
