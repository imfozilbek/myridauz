import type { Booking, Offer, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { RequestScreen } from '../market/request-card';
import { confirm, haptic } from '../telegram/feedback';
import { errorKey } from '../market/error-text';
import { ActionFailure } from '../states/action-failure';
import { ChatScreen } from '../chat/chat-screen';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { AnswerDeadline } from './answer-deadline';
import { BookingScreen } from './booking-screen';
import { cancellable } from './booking-status';
import { OfferAccepted, OfferScreen, OffersSection } from './offer-list';
import { TripTools } from './trip-tools';

const OFFER_STEP = { accept: 'offer_accepted', decline: 'offer_declined' } as const;

export type Opened =
  | { readonly kind: 'booking'; readonly booking: Booking }
  | { readonly kind: 'request'; readonly request: RideRequest };

type Props = {
  readonly opened: Opened;
  readonly offers: readonly Offer[];
  readonly onClose: (changed: boolean) => void;
};

// What the passenger opened in "Mening safarlarim": a booking, or a request with drivers' offers.
// The parent gives fresh data on each signal (docs/64); an offer is kept by its id (docs/65 B2).
export function PassengerOpen({ opened, offers, onClose }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { bookings, market } = useApiClients();
  const [offerId, setOfferId] = useState<string | null>(null);
  const offer = offers.find((item) => item.id === offerId) ?? null;
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [talk, setTalk] = useState<{ readonly key: string; readonly title: string } | null>(null);
  const [complaint, setComplaint] = useState<string | null>(null);
  // A failed action keeps the screen and says why; the fresh data comes with the next signal.
  const run = async (action: () => Promise<unknown>, after: () => void) => {
    try {
      setFailure(null);
      await action();
      haptic.success();
      after();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
  const open = (next: Offer | null) => {
    setFailure(null);
    setOfferId(next?.id ?? null);
  };
  if (accepted) return <OfferAccepted onDone={() => onClose(true)} />;
  if (complaint) return <ComplaintScreen bookingId={complaint} onBack={() => setComplaint(null)} />;
  if (talk) return <ChatScreen chatKey={talk.key} title={talk.title} onBack={() => setTalk(null)} />;
  if (offer) {
    const answer = (action: 'accept' | 'decline') =>
      run(
        () => bookings.answerOffer(offer.id, action),
        () => {
          track({ name: 'booking_step', screen: 'bookings.offer', step: OFFER_STEP[action] });
          if (action === 'accept') setAccepted(true);
          else onClose(true);
        },
      );
    return (
      <OfferScreen
        offer={offer}
        onBack={() => open(null)}
        onAccept={() => answer('accept')}
        onDecline={() => answer('decline')}
        onChat={() => setTalk({ key: offer.chatKey, title: offer.driver.firstName })}
      >
        <ActionFailure error={failure} />
      </OfferScreen>
    );
  }
  if (opened.kind === 'request') {
    const { request } = opened;
    const mine = offers.filter((item) => item.requestId === request.id && item.status === 'sent');
    return (
      <RequestScreen
        request={request}
        onBack={() => onClose(false)}
        onCancel={() =>
          void run(
            () => market.cancelRequest(request.id),
            () => onClose(true),
          )
        }
      >
        <ActionFailure error={failure} />
        {request.status === 'open' ? <OffersSection offers={mine} onOpen={open} /> : null}
      </RequestScreen>
    );
  }
  const { booking } = opened;
  // A cancel is asked first: one tap never loses a seat (docs/65 B4).
  const cancel = async () => {
    if (!(await confirm(t('bookings.cancelAsk'), t('bookings.cancel')))) return;
    await run(
      () => bookings.cancelMine(booking.id),
      () => {
        track({ name: 'booking_step', screen: 'bookings.passenger', step: 'cancelled' });
        onClose(true);
      },
    );
  };
  const actions = cancellable(booking.status)
    ? [{ label: t('bookings.cancel'), onClick: () => void cancel() }]
    : [];
  const openChat = () => setTalk({ key: booking.chatKey, title: booking.trip.driver.firstName });
  return (
    <BookingScreen booking={booking} side="passenger" onBack={() => onClose(false)} actions={actions}>
      <ActionFailure error={failure} />
      <AnswerDeadline booking={booking} />
      <TripTools booking={booking} onChat={openChat} onComplain={() => setComplaint(booking.id)} />
    </BookingScreen>
  );
}
