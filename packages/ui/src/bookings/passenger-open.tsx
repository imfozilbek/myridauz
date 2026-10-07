import type { Booking, Offer, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { haptic } from '../telegram/feedback';
import { errorKey } from '../market/error-text';
import { ActionFailure } from '../states/action-failure';
import { ChatScreen } from '../chat/chat-screen';
import { AcceptedBooking } from './accepted-booking';
import { MyRequest } from './my-request';
import { OfferScreen } from './offer-list';
import { PassengerBooking } from './passenger-booking';

const OFFER_STEP = { accept: 'offer_accepted', decline: 'offer_declined' } as const;
const isStale = (caught: unknown) =>
  caught instanceof ApiError && Boolean(caught.code?.endsWith('.wrong_status'));

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
};

// What the passenger opened in "Mening safarlarim": a booking, or a request with drivers' offers.
// The parent gives fresh data on each signal (docs/64); an offer is kept by its id (docs/65 B2).
export function PassengerOpen({ opened, offers, onClose, onStale, onHome }: Props) {
  const { track } = useAnalytics();
  const { bookings, market } = useApiClients();
  const [offerId, setOfferId] = useState<string | null>(null);
  const offer = offers.find((item) => item.id === offerId) ?? null;
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // The booking of an accepted offer: its page opens at once (G61, journey screen 8).
  const [accepted, setAccepted] = useState<string | null>(null);
  const [talk, setTalk] = useState<{ chatKey: string; title: string; ring?: boolean } | null>(null);
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
  // An answer from the card of the request or from the screen of the offer (G61, mockup 3-offers A).
  const answer = (answered: Offer, action: 'accept' | 'decline') =>
    run(
      () => bookings.answerOffer(answered.id, action),
      (result) => {
        track({ name: 'booking_step', screen: 'bookings.offer', step: OFFER_STEP[action] });
        if (action === 'accept' && result.bookingId) setAccepted(result.bookingId);
        else open(null);
      },
    );
  if (accepted) return <AcceptedBooking bookingId={accepted} onClose={onClose} onHome={onHome} />;
  if (talk) return <ChatScreen {...talk} onTrip={() => setTalk(null)} onBack={() => setTalk(null)} />;
  if (offer)
    return (
      <OfferScreen
        offer={offer}
        onBack={() => open(null)}
        onAccept={() => answer(offer, 'accept')}
        onDecline={() => answer(offer, 'decline')}
        onChat={() => setTalk({ chatKey: offer.chatKey, title: offer.driver.firstName })}
      >
        <ActionFailure error={failure} />
      </OfferScreen>
    );
  if (opened.kind === 'request')
    return (
      <MyRequest
        request={opened.request}
        offers={offers}
        failure={failure}
        onBack={() => onClose(false)}
        onCancel={() =>
          void run(
            () => market.cancelRequest(opened.request.id),
            () => onClose(true),
          )
        }
        onAnswer={answer}
        onOpen={open}
      />
    );
  return <PassengerBooking booking={opened.booking} onClose={onClose} onStale={onStale} onHome={onHome} />;
}
