import type { Booking, Trip } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useRef, useState } from 'react';
import { useAnswerBooking } from '../bookings/use-answer-booking';
import { useBalance } from '../bookings/use-balance';
import { useTripStory } from '../comfort/use-trip-story';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useFailure } from '../states/use-failure';
import { confirm, haptic } from '../telegram/feedback';
import { canShareStory } from '../telegram/story';
import type { OwnTripTile } from './own-trip-tiles';
import type { Opened } from './own-trip-opened';
import { tileBlock } from './tile-block';
import type { TripStage } from './trip-stage';
import { useCloseShare } from './use-close-share';

type Options = {
  readonly trip: Trip;
  readonly stage: TripStage;
  readonly bookings: readonly Booking[];
  readonly open: (opened: Opened) => void;
  // Fresh data after an answer (docs/64); the list after the trip is cancelled.
  readonly onChanged: () => void;
  readonly onClosed: () => void;
};

// What «Mening safarim» does (G63): the answers to the requests with the wallet beside them, the
// four tiles and the cancel. A failed action keeps the page with its reason (docs/65 B3).
export function useOwnTripActions({ trip, stage, bookings, open, onChanged, onClosed }: Options) {
  const { t } = useI18n();
  const { market } = useApiClients();
  const balance = useBalance(bookings.some((booking) => booking.status === 'requested'));
  const { failure, fail, clear } = useFailure();
  // Why a tile cannot work now: it stays on the page and says so (docs/121).
  const [note, setNote] = useState<TranslationKey | null>(null);
  const share = useCloseShare(trip.id, fail);
  const story = useTripStory(trip);
  const posting = useRef(false);
  const cancelling = useRef(false);
  const answerBooking = useAnswerBooking({
    onDone: () => {
      balance.reload();
      onChanged();
    },
    onShort: (booking) => open({ screen: 'not_enough', booking }),
    fail,
  });
  const answer = (booking: Booking, action: 'confirm' | 'decline') => {
    clear();
    return answerBooking(booking, action);
  };
  const postStory = async () => {
    if (posting.current) return;
    posting.current = true;
    await story().catch(fail);
    posting.current = false;
  };
  const riders = bookings.filter((booking) => booking.status === 'confirmed').length;
  const tile = (which: OwnTripTile) => {
    clear();
    const block = tileBlock(which, { trip, stage, stories: canShareStory(), riders });
    setNote(block);
    if (block) return;
    if (which === 'share') void share.share();
    else if (which === 'story') void postStory();
    else if (which === 'change') open({ screen: 'change' });
    else open({ screen: 'map' });
  };
  // A cancel is asked first; the passengers hear about it (docs/65 B4). A second tap while it is
  // asked or sent does nothing (docs/65 A4).
  const cancel = async () => {
    if (cancelling.current) return;
    cancelling.current = true;
    try {
      if (!(await confirm(t('market.trip.cancelAsk'), t('market.trip.cancel')))) return;
      clear();
      await market.cancelTrip(trip.id);
      haptic.success();
      onClosed();
    } catch (caught) {
      fail(caught);
    } finally {
      cancelling.current = false;
    }
  };
  return { balance: balance.balance, failure, note, share, answer, tile, cancel };
}
