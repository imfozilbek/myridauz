import type { RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { OfferSheet } from '../requests/offer-sheet';
import { ACTIONS } from '../requests/request-row';
import { SalonSheet } from '../requests/salon-sheet';
import { useTripOffer } from '../requests/use-trip-offer';
import { ActionFailure } from '../states/action-failure';
import { useOneAtATime } from '../telegram/one-at-a-time';
import { ShortfallSheet } from '../wallet/shortfall-sheet';
import '../requests/board.css';
import './talk.css';

type Props = {
  readonly request: RideRequest;
  // The offer went: the talk shows its card in place of the button (mockup g64/5 phone 3).
  readonly onSent: () => unknown;
  // A trip for a whole car opens as from the board: «Mening safarim» (G77).
  readonly onTrip?: ((tripId: string) => void) | undefined;
  readonly className?: string;
};

// The driver's one action in a talk (mockups g64/2 phone 2, g64/5): the same as on the card of the
// board. A live trip that fits: one tap; a whole car without a trip: the trip from the request; else
// the time and the price (docs/118 path 7).
export function TalkAction({ request, onSent, onTrip, className = 'talk-action' }: Props) {
  const { t } = useI18n();
  const { market } = useApiClients();
  const board = useLoad(() => market.requestBoard({ date: request.date })).value;
  const [sheet, setSheet] = useState<'offer' | 'salon' | null>(null);
  // As on the board (G77): counted, and a wallet short of the commission opens its sheet.
  const offering = useTripOffer('chat');
  const trip = board?.trip && board.fits.some((fit) => fit.id === request.id) ? board.trip : null;
  const action = trip ? 'onTrip' : request.wholeCar ? 'salon' : 'offer';
  const sent = async () => {
    setSheet(null);
    await onSent();
  };
  const tap = useOneAtATime(async () => {
    offering.clear();
    if (!trip) return setSheet(action === 'salon' ? 'salon' : 'offer');
    if (await offering.onTrip(request, trip)) await onSent();
  });
  const short = (need: number) => {
    setSheet(null);
    offering.short(need, request);
  };
  // A live trip that the request does not fit: as on the board, a new offer waits until the trip is
  // over; the server refuses it (one at a time, docs/172, G91 DRV-4).
  if (board?.busy && !trip) return <p className="board-busy">{t('requests.board.busy')}</p>;
  return (
    <>
      <ActionFailure error={offering.failure} />
      <button type="button" className={className} disabled={!board || tap.busy} onClick={tap.run}>
        {t(ACTIONS[action])}
      </button>
      <OfferSheet
        request={sheet === 'offer' ? request : null}
        onClose={() => setSheet(null)}
        onSent={sent}
        onShort={short}
      />
      {board ? (
        <SalonSheet
          request={sheet === 'salon' ? request : null}
          seats={board.carSeats}
          onClose={() => setSheet(null)}
          onOpened={async (tripId) => {
            await sent();
            onTrip?.(tripId);
          }}
          onShort={short}
        />
      ) : null}
      <ShortfallSheet shortfall={offering.shortfall} onClose={offering.closeShortfall} />
    </>
  );
}
