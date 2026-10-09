import { BOOKING_LINK, chatKeyOfOffer, DAY_MS, MY_TRIP_LINK, type Booking } from '@platform/contracts';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { useDriverData } from '../../home/driver-data';
import { usePassengerData } from '../../home/passenger-data';
import type { PlaceDirectory } from '../../places/directory';
import { itemKey, type ActionItem } from '../action-item';
import { CarLine, TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

const SEEN = 'sheet-answers-seen';
const KEPT = 50;

// The answers this phone showed already: a convenience, lost storage shows a fresh one again.
function seen(): readonly string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SEEN) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(SEEN, JSON.stringify([id, ...seen()].slice(0, KEPT)));
  } catch {
    // No storage on this phone: the answer may show once more, nothing breaks.
  }
}

// An answer of the other side within a day, not seen yet; what the person did alone is not news
// (docs/122): the seat a passenger took by an offer, the request a driver confirmed.
const fresh = (booking: Booking, byOffer: boolean) =>
  booking.status === 'confirmed' &&
  booking.confirmedAt !== null &&
  Date.now() - booking.confirmedAt < DAY_MS &&
  booking.chatKey.startsWith(chatKeyOfOffer('')) === byOffer &&
  !seen().includes(booking.id);

// «Joyingiz tasdiqlandi» or «Taklif qabul qilindi» (docs/122, mockup g68/7 screen 6): the same sheet
// for both roles; «Safarni ochish» opens the trip, «Yaxshi» closes it for good.
function useAnswerItem(directory: PlaceDirectory, go: HomeGo) {
  const { t, formatNumber } = useI18n();
  const words = useSheetWords(directory);
  return (booking: Booking, side: 'passenger' | 'driver'): ActionItem => {
    const person = side === 'driver' ? booking.passenger : booking.trip.driver;
    const { car } = booking.trip.driver;
    const seats = booking.wholeCar ? t('sheet.salon') : t('sheet.seats', { seats: String(booking.seats) });
    const price = t('sheet.request.price', {
      seats: String(booking.seats),
      price: formatNumber(booking.price),
    });
    const color = t(`drivers.color.${car.color}`);
    return {
      key: itemKey('answer', booking.id),
      kind: 'answer',
      face: { id: person.id, name: person.firstName, hasAvatar: person.hasAvatar },
      badge: 'selected',
      kicker: t(side === 'driver' ? 'sheet.answer.offer' : 'sheet.answer.seat'),
      title: t('sheet.who', { name: person.firstName, what: seats }),
      sub:
        side === 'driver' ? (
          t('sheet.answer.offerSub')
        ) : (
          <CarLine
            car={t('sheet.car', { color, make: car.make, model: car.model })}
            plate={booking.plate ?? car.plate}
          />
        ),
      body: (
        <TripBlock
          head={words.line(booking.trip)}
          rows={[{ label: price, value: formatNumber(booking.price * booking.seats), strong: true }]}
        />
      ),
      main: {
        label: t('sheet.answer.open'),
        run: () => {
          const link =
            side === 'driver'
              ? { name: MY_TRIP_LINK, id: booking.trip.id }
              : { name: BOOKING_LINK, id: booking.id };
          go('my_trips', { link });
          return undefined;
        },
      },
      later: t('sheet.answer.ok'),
      onAside: () => markSeen(booking.id),
    };
  };
}

// The passenger: the driver confirmed the seat asked.
export function usePassengerAnswers(directory: PlaceDirectory, go: HomeGo): ActionItem[] {
  const { value } = usePassengerData();
  const item = useAnswerItem(directory, go);
  return (value?.[0] ?? []).filter((booking) => fresh(booking, false)).map((one) => item(one, 'passenger'));
}

// The driver: the passenger took the offer of the driver.
export function useDriverAnswers(directory: PlaceDirectory, go: HomeGo): ActionItem[] {
  const { value } = useDriverData();
  const item = useAnswerItem(directory, go);
  return (value?.[1] ?? []).filter((booking) => fresh(booking, true)).map((one) => item(one, 'driver'));
}
