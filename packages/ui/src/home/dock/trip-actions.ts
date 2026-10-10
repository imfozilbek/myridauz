import { MY_TRIP_LINK, NEW_TRIP_SECTION, type Booking, type Trip } from '@platform/contracts';
import { openSheet } from '../../action-sheet/action-queue';
import { useUnreadChats } from '../../chats/unread-chats';
import { useOpenChat } from '../../chat/open-chat';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { useMeetMark } from '../../meeting/use-meet-mark';
import type { PlaceDirectory } from '../../places/directory';
import { useFailure } from '../../states/use-failure';
import { haptic } from '../../telegram/feedback';
import { useTopUp } from '../../wallet/top-up-link';
import { useHomeTap } from '../use-home-tap';

// What the cards of a driver do (G76, docs/165): the trip, its chats and calls (numbers hidden,
// docs/07), the marks of the point, the ready words, the money, the way back.
export function useTripActions(go: HomeGo, directory: PlaceDirectory | null, refresh: () => void) {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const openChat = useOpenChat();
  const topUp = useTopUp();
  const tap = useHomeTap();
  const meet = useMeetMark(() => refresh());
  const unread = new Set(useUnreadChats().map((one) => one.key));
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
  return {
    failure: failure ?? meet.failure,
    open: (trip: Trip) => tap('item', () => go('my_trips', { link: { name: MY_TRIP_LINK, id: trip.id } })),
    chat: (booking: Booking) => tap('trip_chat', () => openChat(booking.chatKey)),
    unread: (booking: Booking) => unread.has(booking.chatKey),
    // An unread message: its sheet with ready answers, the chat stays closed (docs/164).
    talk: (booking: Booking) =>
      tap('trip_chat', () =>
        unread.has(booking.chatKey) ? openSheet('message', booking.chatKey) : openChat(booking.chatKey),
      ),
    call: (booking: Booking) => tap('trip_call', () => openChat(booking.chatKey, 'ring')),
    came: (booking: Booking) => () => void meet.mark(booking, 'came'),
    met: (booking: Booking) => () => void meet.mark(booking, 'met'),
    missed: (booking: Booking) => () => void meet.mark(booking, 'no_show'),
    say: (booking: Booking, key: 'five' | 'ten') =>
      run(() => chat.answer(booking.chatKey, t(`sheet.meet.${key}Say.driver`))),
    topUp: (booking: Booking | undefined, missing: number) => () =>
      topUp(booking?.passenger.firstName ?? '', missing),
    // «Qaytish safari»: the same road back, the day and the time asked (docs/124 В).
    back: (trip: Trip) => () => {
      const from = directory?.find(trip.to);
      const to = directory?.find(trip.from);
      go(NEW_TRIP_SECTION, from && to ? { route: { from, to } } : undefined);
    },
  };
}

export type TripActions = ReturnType<typeof useTripActions>;
