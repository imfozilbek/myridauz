import type { Booking, Offer, OfferAction, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { confirm, haptic } from '../telegram/feedback';
import { useI18n } from '../context/i18n-context';
import { errorKey, isStale } from '../market/error-text';
import { AcceptedBooking } from './accepted-booking';
import { MyRequest } from './my-request';
import { PassengerBooking } from './passenger-booking';
import { RequestOfferSheet } from './request-offer-sheet';
import { useAnswerOffer } from './use-answer-offer';

export type Opened =
  | { readonly kind: 'booking'; readonly booking: Booking }
  | { readonly kind: 'request'; readonly request: RideRequest };

type Props = {
  readonly opened: Opened;
  readonly offers: readonly Offer[];
  readonly onClose: (changed: boolean) => void;
  // A seat or a request changed meanwhile: the parent loads it again at once (G52, docs/112).
  readonly onStale?: () => void;
  readonly onHome?: () => void; // «Bosh sahifa» of a waiting request (docs/118 path 2, C)
  readonly stars?: boolean; // the seat on its stars at once: «Baho berish» of the block (G79 П3)
};

// What the passenger opened in "Mening safarlarim": a booking, or a request with drivers' offers.
// The parent gives fresh data on each signal (docs/64); an offer is kept by its id (docs/65 B2).
export function PassengerOpen({ opened, offers, onClose, onStale, onHome, stars = false }: Props) {
  const { t } = useI18n();
  const answerOffer = useAnswerOffer('bookings.offer');
  const { market } = useApiClients();
  const [offerId, setOfferId] = useState<string | null>(null);
  const offer = offers.find((item) => item.id === offerId) ?? null;
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // The booking of an accepted offer: its page opens at once (G61, journey screen 8).
  const [accepted, setAccepted] = useState<string | null>(null);
  // A failed action keeps the screen and says why; the fresh data comes with the next signal.
  const run = async <T,>(action: () => Promise<T>, after: (result: T) => void) => {
    try {
      setFailure(null);
      const result = await action();
      haptic.success();
      after(result);
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
      if (isStale(caught)) onStale?.();
    }
  };
  const open = (next: Offer | null) => (setFailure(null), setOfferId(next?.id ?? null));
  // Asked first, as a seat is: one tap never loses a request with its offers (docs/65 B4).
  const cancelRequest = async (request: RideRequest) => {
    if (!(await confirm(t('market.request.cancelAsk'), t('market.request.cancel')))) return;
    await run(
      () => market.cancelRequest(request.id),
      () => onClose(true),
    );
  };
  // An answer from the card of the request or from the screen of the offer (G61, mockup 3-offers A).
  const answer = (answered: Offer, action: OfferAction) =>
    run(
      () => answerOffer(answered, action),
      (result) => (result.bookingId ? setAccepted(result.bookingId) : open(null)),
    );
  // The sheet says why itself: its answer fails to it (docs/65 B3).
  const answerInSheet = async (answered: Offer, action: OfferAction) => {
    try {
      const result = await answerOffer(answered, action);
      if (result.bookingId) setAccepted(result.bookingId);
      else open(null);
    } catch (caught) {
      if (isStale(caught)) onStale?.();
      throw caught;
    }
  };
  if (accepted) return <AcceptedBooking bookingId={accepted} onClose={onClose} onHome={onHome} />;
  if (opened.kind === 'request')
    return (
      <MyRequest
        request={opened.request}
        offers={offers}
        failure={failure}
        onBack={() => onClose(false)}
        onCancel={() => void cancelRequest(opened.request)}
        onAnswer={answer}
        onOpen={open}
      >
        {/* One offer opens in the sheet of the main screen over the request (G78 sheet 2). */}
        <RequestOfferSheet
          offer={offer}
          same={offers.filter((one) => one.requestId === opened.request.id && one.status === 'sent').length}
          onAnswer={answerInSheet}
          onClose={() => open(null)}
        />
      </MyRequest>
    );
  return (
    <PassengerBooking
      booking={opened.booking}
      onClose={onClose}
      onStale={onStale}
      onHome={onHome}
      stars={stars}
    />
  );
}
