import { ApiError } from '@platform/api-client';
import type { RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { useLoad } from '../market/use-list';
import { OfferSheet } from '../requests/offer-sheet';
import { ACTIONS } from '../requests/request-row';
import { SalonSheet } from '../requests/salon-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { useOneAtATime } from '../telegram/one-at-a-time';
import './talk.css';

// The money of a commission the wallet lacks: the words of the error, the way to top up is the wallet.
const NOT_ENOUGH = new ApiError(402, 'wallet.not_enough');

type Props = {
  readonly request: RideRequest;
  // The offer went: the talk shows its card in place of the button (mockup g64/5 phone 3).
  readonly onSent: () => unknown;
  readonly className?: string;
};

// The driver's one action in a talk (mockups g64/2 phone 2, g64/5): the same as on the card of the
// board. A live trip that fits: one tap; a whole car without a trip: the trip from the request; else
// the time and the price (docs/118 path 7).
export function TalkAction({ request, onSent, className = 'talk-action' }: Props) {
  const { t } = useI18n();
  const { market, bookings } = useApiClients();
  const board = useLoad(() => market.requestBoard({ date: request.date })).value;
  const [sheet, setSheet] = useState<'offer' | 'salon' | null>(null);
  const { failure, fail, clear } = useFailure();
  const trip = board?.trip && board.fits.some((fit) => fit.id === request.id) ? board.trip : null;
  const action = trip ? 'onTrip' : request.wholeCar ? 'salon' : 'offer';
  const sent = async () => {
    setSheet(null);
    await onSent();
  };
  const tap = useOneAtATime(async () => {
    clear();
    if (!trip) return setSheet(action === 'salon' ? 'salon' : 'offer');
    try {
      await bookings.sendOffer(request.id, { departAt: trip.departAt, price: trip.price, tripId: trip.id });
      haptic.success();
      await onSent();
    } catch (caught) {
      fail(caught);
    }
  });
  const short = () => {
    setSheet(null);
    fail(NOT_ENOUGH);
  };
  return (
    <>
      <ActionFailure error={failure} />
      <button type="button" className={className} disabled={!board || tap.busy} onClick={tap.run}>
        {t(ACTIONS[action])}
      </button>
      <OfferSheet
        request={sheet === 'offer' ? request : null}
        onClose={() => setSheet(null)}
        onSent={sent}
        onShort={short}
      />
      <SalonSheet
        request={sheet === 'salon' ? request : null}
        onClose={() => setSheet(null)}
        onOpened={sent}
        onShort={short}
      />
    </>
  );
}
