import { MINUTE_MS, type Booking } from '@platform/contracts';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { useDriverData } from '../../home/driver-data';
import { useNow } from '../../own-trip/use-now';
import type { PlaceDirectory } from '../../places/directory';
import { haptic } from '../../telegram/feedback';
import { itemKey, type ActionItem } from '../action-item';
import { TripBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

const HOUR_MINUTES = 60;

// «Yangi soʻrov» of a driver (docs/122, mockup g68/7 screen 3): who and how many seats, the trip,
// the sum and the commission before «Tasdiqlash», the time left; one tap answers (docs/35).
export function useRequestItems(directory: PlaceDirectory): ActionItem[] {
  const { t, formatNumber } = useI18n();
  const { bookings } = useApiClients();
  const { track } = useAnalytics();
  const { value, refresh } = useDriverData();
  const words = useSheetWords(directory);
  const now = useNow();
  const left = (until: number) => {
    const minutes = Math.max(0, Math.floor((until - now) / MINUTE_MS));
    return minutes < HOUR_MINUTES
      ? t('sheet.request.left', { minutes: String(minutes) })
      : t('sheet.request.leftHours', { hours: String(Math.floor(minutes / HOUR_MINUTES)) });
  };
  const answer = async (booking: Booking, action: 'confirm' | 'decline') => {
    await bookings.answer(booking.id, action);
    track({ name: 'booking_step', screen: 'sheet', step: action === 'confirm' ? 'confirmed' : 'declined' });
    haptic.success();
    refresh();
  };
  const requests = (value?.[1] ?? []).filter((one) => one.status === 'requested' && one.expiresAt > now);
  return requests.map((booking) => {
    const { passenger, seats, price, commission } = booking;
    const name = passenger.firstName;
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
            { label: t('sheet.request.commission'), value: formatNumber(commission) },
          ]}
        />
      ),
      alert: left(booking.expiresAt),
      main: {
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
  });
}
