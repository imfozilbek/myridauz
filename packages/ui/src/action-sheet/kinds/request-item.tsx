import { MINUTE_MS, type Booking } from '@platform/contracts';
import { notEnough, useAnswerBooking } from '../../bookings/use-answer-booking';
import { missingFor } from '../../bookings/use-balance';
import { useI18n } from '../../context/i18n-context';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { useTopUp } from '../../wallet/top-up-link';
import { itemKey, type ActionItem } from '../action-item';
import { TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

const HOUR_MINUTES = 60;

type Answer = (booking: Booking, action: 'confirm' | 'decline') => Promise<unknown>;

// The answer of a sheet (G77): the same as «Mening safarim» and the booking; a failure stays in the
// sheet with its reason (docs/65 B3), the money short of the commission too.
export function useSheetAnswer(onDone: () => void): Answer {
  return useAnswerBooking({
    screen: 'sheet',
    onDone,
    onShort: () => {
      throw notEnough();
    },
    fail: (caught) => {
      throw caught;
    },
  });
}

// «Yangi soʻrov» of a driver (docs/122, mockup g68/7 screen 3): who and how many seats, the trip,
// the sum and the commission before «Tasdiqlash», the time left; one tap answers (docs/35). One
// sheet on the main screen and over «Mening safarim» (G78 sheet 3). Short of the commission, the
// sum short and «Hisobni toʻldirish» opens the support chat at once (docs/158 Г, docs/170 В9).
export function useRequestItem(directory: PlaceDirectory) {
  const { t, formatNumber } = useI18n();
  const words = useSheetWords(directory);
  const now = useNow();
  const topUp = useTopUp();
  const left = (until: number) => {
    const minutes = Math.max(0, Math.floor((until - now) / MINUTE_MS));
    return minutes < HOUR_MINUTES
      ? t('sheet.request.left', { minutes: String(minutes) })
      : t('sheet.request.leftHours', { hours: String(Math.floor(minutes / HOUR_MINUTES)) });
  };
  return (booking: Booking, balance: number | null, answer: Answer): ActionItem => {
    const { passenger, seats, price, commission } = booking;
    const name = passenger.firstName;
    const missing = missingFor(balance, commission);
    const rating = passenger.rating?.average;
    return {
      key: itemKey('request', booking.id),
      kind: 'request',
      face: { id: passenger.id, name, hasAvatar: passenger.hasAvatar },
      badge: 'passengers',
      kicker: t('sheet.request.kicker'),
      title: t('sheet.who', {
        name,
        what: booking.wholeCar ? t('sheet.salon') : t('sheet.seats', { seats: String(seats) }),
      }),
      sub:
        rating === undefined || rating === null
          ? t('sheet.newcomer')
          : t('sheet.rating', { average: formatNumber(rating), count: String(passenger.rating?.count ?? 0) }),
      body: (
        <TripBlock
          head={words.line(booking.trip)}
          rows={[
            { label: t('sheet.request.pickup'), value: words.pickup(booking) },
            {
              label: t('sheet.request.price', { seats: String(seats), price: formatNumber(price) }),
              value: formatNumber(price * seats),
              strong: true,
            },
            { label: t('bookings.offer.commission'), value: formatNumber(commission) },
            ...(missing > 0
              ? [{ label: t('wallet.short.missing'), value: formatNumber(missing), strong: true }]
              : []),
          ]}
        />
      ),
      alert: left(booking.expiresAt),
      main:
        missing > 0
          ? { label: t('wallet.topUp'), run: async () => void topUp(name, missing), aside: true }
          : {
              label: t('sheet.request.confirm'),
              run: async () => {
                await answer(booking, 'confirm');
                return t('sheet.request.confirmed', { name, commission: formatNumber(commission) });
              },
            },
      second: {
        label: t('sheet.request.decline'),
        run: async () => {
          await answer(booking, 'decline');
          return t('sheet.request.declined', { name });
        },
      },
    };
  };
}
