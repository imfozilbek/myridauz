import { ApiError } from '@platform/api-client';
import type { Booking, Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useRef, useState } from 'react';
import { useBalance } from '../bookings/use-balance';
import { useTripStory } from '../comfort/use-trip-story';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { laterTimes } from '../market/trip-change-options';
import { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';
import type { OwnTripTile } from './own-trip-tiles';
import type { Opened } from './own-trip-opened';
import { useCloseShare } from './use-close-share';

const STEP_OF = { confirm: 'confirmed', decline: 'declined' } as const;

type Options = {
  readonly trip: Trip;
  readonly bookings: readonly Booking[];
  readonly open: (opened: Opened) => void;
  // Fresh data after an answer (docs/64); the list after the trip is cancelled.
  readonly onChanged: () => void;
  readonly onClosed: () => void;
};

// What «Mening safarim» does (G63): the answers to the requests with the wallet beside them, the
// four tiles and the cancel. A failed action keeps the page with its reason (docs/65 B3).
export function useOwnTripActions({ trip, bookings, open, onChanged, onClosed }: Options) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { market, bookings: api } = useApiClients();
  const balance = useBalance();
  const { failure, fail, clear } = useFailure();
  // Why a tile cannot work now: it stays on the page and says so (docs/121).
  const [note, setNote] = useState<TranslationKey | null>(null);
  const share = useCloseShare(trip.id, fail);
  const story = useTripStory(trip);
  const posting = useRef(false);
  const answer = async (booking: Booking, action: 'confirm' | 'decline') => {
    clear();
    try {
      await api.answer(booking.id, action);
      track({ name: 'booking_step', screen: 'bookings.driver', step: STEP_OF[action] });
      haptic.success();
      balance.reload();
      onChanged();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough')
        open({ screen: 'not_enough', booking });
      else fail(caught);
    }
  };
  const postStory = async () => {
    if (posting.current) return;
    posting.current = true;
    await story.post().catch(fail);
    posting.current = false;
  };
  const ahead = (trip.status === 'active' || trip.status === 'full') && trip.departAt > Date.now();
  const tile = (which: OwnTripTile) => {
    clear();
    setNote(null);
    if (which === 'share') void share.share();
    else if (which === 'story') {
      if (story.block) setNote(`driverTrip.story.${story.block}`);
      else void postStory();
    } else if (which === 'change') {
      // Only the price is left once the time moved the whole hour (docs/104).
      if (!ahead) setNote('driverTrip.change.closed');
      else open(laterTimes(trip).length > 0 ? { screen: 'choice' } : { screen: 'change', change: 'price' });
    } else if (bookings.some((booking) => booking.status === 'confirmed')) open({ screen: 'map' });
    else setNote('way.map.empty');
  };
  // A cancel is asked first; the passengers hear about it (docs/65 B4).
  const cancel = async () => {
    if (!(await confirm(t('market.trip.cancelAsk'), t('market.trip.cancel')))) return;
    clear();
    try {
      await market.cancelTrip(trip.id);
      haptic.success();
      onClosed();
    } catch (caught) {
      fail(caught);
    }
  };
  return { balance: balance.balance, failure, note, share, answer, tile, cancel };
}
