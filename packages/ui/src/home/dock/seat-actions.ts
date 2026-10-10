import { BOOKING_LINK, type Booking } from '@platform/contracts';
import { openSheet } from '../../action-sheet/action-queue';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { mapUrl } from '../../bookings/map-link';
import { useShareTrip } from '../../bookings/use-share-trip';
import { useFailure } from '../../states/use-failure';
import { haptic, openExternal, openInTelegram } from '../../telegram/feedback';
import { TALK_CALL, TRIP_TALK } from '../trip-talk';
import { useHomeTap } from '../use-home-tap';

// What the cards of a seat do (G76, docs/165): the chat and the call of the trip (numbers hidden,
// docs/07), the seat itself, a cancel, «Men keldim», the ready words of the meeting, the close
// people, the support. A failure shows under the card, the block refreshes after a step.
export function useSeatActions(go: HomeGo, refresh: () => void) {
  const { t } = useI18n();
  const { bookings, chat } = useApiClients();
  const { track } = useAnalytics();
  const { bots } = useBrand();
  const share = useShareTrip();
  const tap = useHomeTap();
  const { failure, fail, clear } = useFailure();
  const run = (action: () => Promise<unknown>) => async () => {
    clear();
    try {
      await action();
      haptic.success();
      refresh();
    } catch (caught) {
      fail(caught);
    }
  };
  const link = (booking: Booking, name: string) => ({ link: { name, id: booking.id } });
  return {
    failure,
    chat: (booking: Booking) => tap('trip_chat', () => go(TRIP_TALK, link(booking, 'chat'))),
    // An unread message: its sheet with ready answers, the chat stays closed (docs/164).
    talk: (booking: Booking) =>
      tap('trip_chat', () =>
        (booking.unread ?? 0) > 0
          ? openSheet('message', booking.chatKey)
          : go(TRIP_TALK, link(booking, 'chat')),
      ),
    call: (booking: Booking) => tap('trip_call', () => go(TRIP_TALK, link(booking, TALK_CALL))),
    open: (booking: Booking) => tap('item', () => go('my_trips', link(booking, BOOKING_LINK))),
    cancel: (booking: Booking) => run(() => bookings.cancelMine(booking.id)),
    came: (booking: Booking) =>
      run(async () => {
        await chat.came(booking.id);
        track({ name: 'booking_step', screen: 'home', step: 'came' });
      }),
    say: (booking: Booking, key: 'five' | 'ten') =>
      run(() => chat.answer(booking.chatKey, t(`sheet.meet.${key}Say.passenger`))),
    share: (booking: Booking) => run(() => share(booking.id)),
    map: (booking: Booking) => () => {
      const point = booking.pitak?.point ?? booking.pickup?.point;
      if (point) openExternal(mapUrl(point));
    },
    support: () => openInTelegram(`https://t.me/${bots.support}`),
  };
}

export type SeatActions = ReturnType<typeof useSeatActions>;
