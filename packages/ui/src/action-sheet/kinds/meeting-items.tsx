import type { Booking } from '@platform/contracts';
import { useOpenChat } from '../../chat/open-chat';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import { useDriverData } from '../../home/driver-data';
import { usePassengerData } from '../../home/passenger-data';
import type { PlaceDirectory } from '../../places/directory';
import { haptic } from '../../telegram/feedback';
import { itemKey, type ActionItem, type SheetAction } from '../action-item';
import { CarBlock } from '../sheet-parts';
import { useSheetWords } from '../trip-line';

type Side = 'passenger' | 'driver';
// Still at the point: nobody boarded, met or missed (docs/126).
const atPoint = (booking: Booking) =>
  booking.status === 'confirmed' &&
  booking.boardedAt === null &&
  booking.metAt === null &&
  booking.noShowAt === null;

// «Uchrashuv» (docs/122, docs/126, mockup g68/8): the other one came to the point and waits;
// «Men keldim» tells it in one tap, «5 daqiqada» and «10 daqiqada» write it, «Qoʻngʻiroq» rings.
function useMeetingItem(side: Side, directory: PlaceDirectory) {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const openChat = useOpenChat();
  const words = useSheetWords(directory);
  return (booking: Booking, person: Booking['passenger'], main: SheetAction): ActionItem => {
    const say = (key: 'five' | 'ten'): SheetAction => ({
      label: t(`sheet.meet.${key}`),
      run: async () => {
        await chat.answer(booking.chatKey, t(`sheet.meet.${key}Say.${side}`));
        return t('sheet.message.sent');
      },
    });
    const { car } = booking.trip.driver;
    const color = t(`drivers.color.${car.color}`);
    return {
      key: itemKey('meeting', booking.id),
      kind: 'meeting',
      face: { id: person.id, name: person.firstName, hasAvatar: person.hasAvatar },
      badge: 'pickup',
      kicker: t('sheet.meet.kicker'),
      title: t('sheet.meet.came', { name: person.firstName }),
      sub: words.waits(booking),
      ...(side === 'passenger'
        ? {
            body: (
              <CarBlock
                car={t('sheet.car', { color, make: car.make, model: car.model })}
                plate={booking.plate ?? car.plate}
              />
            ),
          }
        : {}),
      main: { ...main, icon: 'pickup' },
      chips: [
        say('five'),
        say('ten'),
        { label: t('sheet.meet.call'), run: () => void openChat(booking.chatKey, 'ring') },
      ],
      chipsBelow: true,
      later: null,
    };
  };
}

// The passenger: the driver said «Men keldim», the passenger did not yet.
export function usePassengerMeetings(directory: PlaceDirectory): ActionItem[] {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const { track } = useAnalytics();
  const { value, refresh } = usePassengerData();
  const item = useMeetingItem('passenger', directory);
  const waiting = (value?.[0] ?? []).filter(
    (booking) => atPoint(booking) && booking.driverCameAt !== null && booking.cameAt === null,
  );
  return waiting.map((booking) =>
    item(booking, booking.trip.driver, {
      label: t('bookings.meeting.came'),
      run: async () => {
        await chat.came(booking.id);
        track({ name: 'booking_step', screen: 'sheet', step: 'came' });
        haptic.success();
        void refresh();
        return t('sheet.meet.told.passenger');
      },
    }),
  );
}

// The driver: the passenger said «Men keldim», the driver did not yet.
export function useDriverMeetings(directory: PlaceDirectory): ActionItem[] {
  const { t } = useI18n();
  const { bookings } = useApiClients();
  const { value, refresh } = useDriverData();
  const item = useMeetingItem('driver', directory);
  const waiting = (value?.[1] ?? []).filter(
    (booking) => atPoint(booking) && booking.cameAt !== null && booking.driverCameAt === null,
  );
  return waiting.map((booking) =>
    item(booking, booking.passenger, {
      label: t('bookings.meeting.came'),
      run: async () => {
        await bookings.meet(booking.id, 'came');
        haptic.success();
        void refresh();
        return t('sheet.meet.told.driver');
      },
    }),
  );
}
