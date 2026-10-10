import { MY_TRIP_LINK, NEW_TRIP_SECTION, type Booking, type Trip } from '@platform/contracts';
import { openSheet } from '../../action-sheet/action-queue';
import { useUnreadChats } from '../../chats/unread-chats';
import { useOpenChat } from '../../chat/open-chat';
import type { TripScreen } from '../../own-trip/own-trip-opened';
import { useAnalytics } from '../../context/analytics-context';
import { useApiClients } from '../../context/api-clients';
import { useI18n } from '../../context/i18n-context';
import type { HomeGo } from '../../flow/start-action';
import { useMeetMark } from '../../meeting/use-meet-mark';
import type { PlaceDirectory } from '../../places/directory';
import { useFailure } from '../../states/use-failure';
import { haptic } from '../../telegram/feedback';
import { tomorrow } from '../../market/when';
import { returnDepartAt, returnTrip } from '../../trip-end/return-plan';
import { useTopUp } from '../../wallet/top-up-link';
import { useHomeTap } from '../use-home-tap';
import { useRef } from 'react';

// What the cards of a driver do (G76, docs/165): the trip, its chats and calls (numbers hidden,
// docs/07), the marks of the point, the ready words, the money, the way back.
export function useTripActions(go: HomeGo, directory: PlaceDirectory | null, refresh: () => void) {
  const { t } = useI18n();
  const { chat } = useApiClients();
  const { track } = useAnalytics();
  const openChat = useOpenChat();
  const topUp = useTopUp();
  const tap = useHomeTap();
  const meet = useMeetMark(() => refresh(), 'home');
  // The passengers told «Kechikyapman» while the app is open: a second tap tells nobody twice.
  const told = useRef(new Set<string>());
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
    // The trip, or right its «Safar tugadi» or its map (G76).
    open: (trip: Trip, screen?: TripScreen) =>
      tap('item', () =>
        go('my_trips', {
          link: { name: MY_TRIP_LINK, id: trip.id },
          ...(screen ? { tripScreen: screen } : {}),
        }),
      ),
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
    // «Kechikyapman» an hour after the time: the word goes once into the chat of every passenger who
    // still waits, not to one marked «Kelmadi» or already in the car; the trip stays as it is (owner
    // decision 10.10.2026, docs/165).
    late: (people: readonly Booking[]) =>
      run(() =>
        Promise.all(
          people
            .filter((booking) => booking.status === 'confirmed' && booking.noShowAt === null)
            .filter((booking) => booking.boardedAt === null && !told.current.has(booking.id))
            .map(async (booking) => {
              await chat.answer(booking.chatKey, t('home.dock.late'));
              told.current.add(booking.id);
            }),
        ),
      ),
    topUp: (booking: Booking | undefined, missing: number) => () =>
      topUp(booking?.passenger.firstName ?? '', missing),
    // «Qaytish safari»: the way back as «Qaytish» after the trip plans it, tomorrow with the same
    // seats, price and rule (docs/124 В), counted once it is out (docs/29).
    back: (trip: Trip) => () => {
      const plan = directory ? returnTrip(trip, directory, returnDepartAt(trip, tomorrow(Date.now()))) : null;
      const onPublished = () => track({ name: 'return_trip_created', screen: 'market.publish' });
      go(NEW_TRIP_SECTION, plan ? { route: plan.route, again: plan.again, onPublished } : undefined);
    },
  };
}

export type TripActions = ReturnType<typeof useTripActions>;
