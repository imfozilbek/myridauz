import { nearestOrder, type BookedPlace, type Booking, type Point } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { escapeHtml, quote } from '../../../shared/telegram/html';

const { t } = createI18n(DEFAULT_LOCALE);

type Stop = { readonly booking: Booking; readonly point: Point | null; readonly place: string };

const label = (place: BookedPlace | null) => escapeHtml(place?.name?.name ?? place?.area?.name ?? '');

const pickupOf = (booking: Booking): Stop =>
  booking.pitak
    ? { booking, point: booking.pitak.point, place: escapeHtml(booking.pitak.name) }
    : { booking, point: booking.pickup?.point ?? null, place: label(booking.pickup) };

const dropoffOf = (booking: Booking): Stop => ({
  booking,
  point: booking.dropoff?.point ?? null,
  place: label(booking.dropoff),
});

// The nearest stop next, as «Yoʻl koʻrsatish» of the app orders them (G24); a stop without a
// point (erased or never given) goes last.
function ordered(start: Point | null, stops: readonly Stop[]): Stop[] {
  const located = stops.flatMap((stop) => (stop.point ? [{ ...stop, point: stop.point }] : []));
  const rest = stops.filter((stop) => stop.point === null);
  const from = start ?? located[0]?.point;
  return [...(from ? nearestOrder(from, located) : located), ...rest];
}

// The first pickup of the road, for «Safarga 2 soat qoldi: … Birinchisi 07:50 da kutadi» (mockup g68/3).
export const firstPickup = (riders: readonly Booking[]) => ordered(null, riders.map(pickupOf))[0];

// «Yoʻl tartibi» of the trip day (mockup g68/3): the pickups, then the dropoffs; who got in is marked.
export function roadLines(riders: readonly Booking[]): string[] {
  if (riders.length === 0) return [];
  const pickups = ordered(null, riders.map(pickupOf));
  const dropoffs = ordered(pickups.at(-1)?.point ?? null, riders.map(dropoffOf));
  const lines = [
    ...pickups.map(({ booking, place }, index) => {
      const line = t('bot.dcard.pickup', {
        index: String(index + 1),
        icon: booking.pitak ? '🚏' : '🏠',
        name: escapeHtml(booking.passenger.firstName),
        seats: String(booking.seats),
        place,
      });
      return booking.boardedAt === null ? line : `${line} · ${t('bot.dcard.boarded')}`;
    }),
    ...dropoffs.map(({ booking, place }, index) =>
      t('bot.dcard.dropoff', {
        index: String(pickups.length + index + 1),
        name: escapeHtml(booking.passenger.firstName),
        place,
      }),
    ),
  ];
  return [quote([t('bot.dcard.road'), ...lines])];
}
