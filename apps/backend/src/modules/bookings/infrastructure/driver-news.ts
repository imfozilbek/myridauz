import type { BrandConfig } from '@platform/brands';
import { isQuietTime, MINUTE_MS, onTheWay, type Booking, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Card, Ring } from '../../notifications';
import type { Places } from '../../../shared/places/end-names';
import { escapeHtml } from '../../../shared/telegram/html';
import { askCard } from './ask-card';
import { driverCard, driverCardKey } from './driver-card';
import { firstPickup } from './road-order';

const { t, formatTime } = createI18n(DEFAULT_LOCALE);

// The news of a trip in the driver bot (G68, docs/122): a new request rings as its own card, the
// rest are short rings under the trip card.
export type DriverRing = 'asked' | 'cancelled' | 'offerAccepted' | 'came' | 'soon';

// «2 soat qoldi» wakes the driver at night; on the road only a cancel rings (docs/122).
const ANY_HOUR: ReadonlySet<DriverRing> = new Set(['soon']);
const ON_THE_ROAD: ReadonlySet<DriverRing> = new Set(['cancelled']);
// The passengers are at the pitak 10 minutes before the time (mockup g68/1, g68/3).
const AT_PITAK_EARLY_MINUTES = 10;

function quietFor(trip: Trip, ring: DriverRing | undefined, now: number): boolean {
  if (ring === undefined) return true;
  if (onTheWay(trip, now) && !ON_THE_ROAD.has(ring)) return true;
  return !ANY_HOUR.has(ring) && isQuietTime(now);
}

const riding = (bookings: readonly Booking[]) => bookings.filter((booking) => booking.status === 'confirmed');

function ringText(trip: Trip, bookings: readonly Booking[], ring: DriverRing, about?: Booking): string {
  if (ring !== 'soon' && ring !== 'asked')
    return t(`bot.dring.${ring}`, { name: escapeHtml(about?.passenger.firstName ?? '') });
  const riders = riding(bookings);
  const first = firstPickup(riders);
  const early = first?.booking.pitak ? AT_PITAK_EARLY_MINUTES * MINUTE_MS : 0;
  return t('bot.dring.soon', {
    count: String(riders.reduce((sum, booking) => sum + booking.seats, 0)),
    time: formatTime(new Date(trip.departAt - early)),
    place: first?.place ?? '',
  });
}

type DriverTrip = {
  readonly trip: Trip;
  // The driver's Telegram ID: the trip facts carry it.
  readonly chatId: number;
  // The bookings of the trip as its driver sees them.
  readonly bookings: readonly Booking[];
};

export type DriverNewsWiring = {
  readonly brand: BrandConfig;
  readonly places: () => Promise<Places>;
  readonly show: (cards: readonly Card[], rings: readonly Ring[]) => Promise<void>;
  readonly trip: (tripId: string) => Promise<DriverTrip | undefined>;
  readonly now: () => number;
};

// about: the booking the news is of; its request card shows what became of it.
export type DriverNews = (tripId: string, about?: string, ring?: DriverRing) => Promise<void>;

// The trip changed: its card shows it without sound; the request card and a ring when there is news.
export const driverNews =
  ({ brand, places, show, trip: tripOf, now }: DriverNewsWiring): DriverNews =>
  async (tripId, about, ring) => {
    const loaded = await tripOf(tripId);
    if (!loaded) return;
    const { trip, chatId, bookings } = loaded;
    const time = now();
    const quiet = quietFor(trip, ring, time);
    const card = driverCard({ brand, chatId, trip, bookings, places: await places(), now: time });
    const booking = bookings.find((item) => item.id === about);
    const ask = booking && askCard({ brand, chatId, booking, quiet });
    // Only «asked» sends a request anew; any other news edits the one sent before.
    const asks = ask ? [ring === 'asked' ? ask : { ...ask, editOnly: true }] : [];
    const text = ring && ring !== 'asked' ? ringText(trip, bookings, ring, booking) : null;
    const rings: Ring[] = text ? [{ bot: 'driver', chatId, text, card: driverCardKey(trip.id), quiet }] : [];
    await show([card, ...asks], rings);
  };
