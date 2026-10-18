import { BOOKING_LINK, type Booking } from '@platform/contracts';
import { openSheet } from '../../action-sheet/action-queue';
import { useOpenChat } from '../../chat/open-chat';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useOpenSupport } from '../../telegram/support-link';
import { useI18n } from '../../context/i18n-context';
import { useAskLeaveReason } from '../../leave/leave-reason';
import type { HomeGo } from '../../flow/start-action';
import { mapUrl } from '../../bookings/map-link';
import { useShareTrip } from '../../bookings/use-share-trip';
import { useCame } from '../../meeting/use-came';
import { useFailure } from '../../states/use-failure';
import { confirm, haptic, openExternal } from '../../telegram/feedback';
import { useHomeTap } from '../use-home-tap';

// What the cards of a seat do (G76, docs/165): the chat and the call of the trip (numbers hidden,
// docs/07), the seat itself, a cancel, «Men keldim», the ready words of the meeting, the close
// people, the support. A failure shows under the card, the block refreshes after a step.
export function useSeatActions(go: HomeGo, refresh: () => void) {
  const { t } = useI18n();
  const { bookings, chat } = useApiClients();
  const { track } = useAnalytics();
  const askReason = useAskLeaveReason();
  const support = useOpenSupport();
  const share = useShareTrip();
  const tap = useHomeTap();
  const openChat = useOpenChat();
  const { failure, fail, clear } = useFailure();
  const here = useCame(() => refresh(), 'home');
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
  const seat = (booking: Booking) => () => go('my_trips', { link: { name: BOOKING_LINK, id: booking.id } });
  // The chat over the main screen, as everywhere (G77): «Назад» comes back here, its line of the trip
  // opens the seat.
  const talkTo = (booking: Booking, ring = false) =>
    openChat(booking.chatKey, ring ? 'ring' : undefined, seat(booking));
  return {
    failure: failure ?? here.failure,
    chat: (booking: Booking) => tap('trip_chat', () => talkTo(booking)),
    // An unread message: its sheet with ready answers, the chat stays closed (docs/164).
    talk: (booking: Booking) =>
      tap('trip_chat', () =>
        (booking.unread ?? 0) > 0 ? openSheet('message', booking.chatKey) : talkTo(booking),
      ),
    call: (booking: Booking) => tap('trip_call', () => talkTo(booking, true)),
    open: (booking: Booking) => tap('item', seat(booking)),
    // «Baho berish»: the seat on its stars at once, as for a driver (G79 П3).
    rate: (booking: Booking) =>
      tap('item', () => go('my_trips', { link: { name: BOOKING_LINK, id: booking.id }, tripScreen: 'end' })),
    // Asked first, as on the page of the seat: one tap never loses a seat (docs/65 B4).
    cancel: (booking: Booking) => async () => {
      if (!(await confirm(t('bookings.cancelAsk'), t('bookings.cancel')))) return;
      await run(async () => {
        await bookings.cancelMine(booking.id);
        track({ name: 'booking_step', screen: 'home', step: 'cancelled' });
        // Why, in one tap that may be skipped (G87, docs/191).
        askReason('booking');
      })();
    },
    came: (booking: Booking) => () => void here.came(booking),
    say: (booking: Booking, key: 'five' | 'ten') =>
      run(() => chat.answer(booking.chatKey, t(`sheet.meet.${key}Say.passenger`))),
    share: (booking: Booking) => run(() => share(booking.id)),
    map: (booking: Booking) => () => {
      const point = booking.pitak?.point ?? booking.pickup?.point;
      if (point) openExternal(mapUrl(point));
    },
    support: () => support(),
  };
}

export type SeatActions = ReturnType<typeof useSeatActions>;
