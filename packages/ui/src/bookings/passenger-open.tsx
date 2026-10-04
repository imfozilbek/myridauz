import type { Booking, Offer, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
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
import { OfferAccepted, OfferScreen } from './offer-list';
import { OffersSection } from './offers-section';
import { TripTools, withTold } from './trip-tools';

const OFFER_STEP = { accept: 'offer_accepted', decline: 'offer_declined' } as const;

const isStale = (caught: unknown) =>
  caught instanceof ApiError && Boolean(caught.code?.endsWith('.wrong_status'));

export type Opened =
  | { readonly kind: 'booking'; readonly booking: Booking }
  | { readonly kind: 'request'; readonly request: RideRequest };

type Props = {
  readonly opened: Opened;
  readonly offers: readonly Offer[];
  // The offer of a bot button opens at once (G40, docs/106 K6).
  readonly offerId?: string;
  readonly onClose: (changed: boolean) => void;
  // A seat or a request changed meanwhile: the parent loads it again at once (G52, docs/112).
  readonly onStale?: () => void;
};

// What the passenger opened in "Mening safarlarim": a booking, or a request with drivers' offers.
// The parent gives fresh data on each signal (docs/64); an offer is kept by its id (docs/65 B2).
export function PassengerOpen({ opened, offers, offerId: linked, onClose, onStale }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { bookings, market } = useApiClients();
  const [offerId, setOfferId] = useState<string | null>(linked ?? null);
  const offer = offers.find((item) => item.id === offerId) ?? null;
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // The booking of an accepted offer: its card goes to the close people (docs/89 P9).
  const [accepted, setAccepted] = useState<{ readonly bookingId: string | null } | null>(null);
  const [talk, setTalk] = useState<{ readonly key: string; readonly title: string } | null>(null);
  const [complaint, setComplaint] = useState<string | null>(null);
  const [told, setTold] = useState<Booking | null>(null);
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
  const open = (next: Offer | null) => {
    setFailure(null);
    setOfferId(next?.id ?? null);
  };
  if (accepted) return <OfferAccepted bookingId={accepted.bookingId} onDone={() => onClose(true)} />;
  if (complaint) return <ComplaintScreen bookingId={complaint} onBack={() => setComplaint(null)} />;
  if (talk) return <ChatScreen chatKey={talk.key} title={talk.title} onBack={() => setTalk(null)} />;
  if (offer) {
    const answer = (action: 'accept' | 'decline') =>
      run(
        () => bookings.answerOffer(offer.id, action),
        (answered) => {
          track({ name: 'booking_step', screen: 'bookings.offer', step: OFFER_STEP[action] });
          if (action === 'accept') setAccepted({ bookingId: answered.bookingId });
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
  const booking = withTold(opened.booking, told);
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
  // In the car or arrived: the seat is used, nothing to cancel (docs/35).
  const inCar = booking.boardedAt !== null || booking.arrivedAt !== null;
  const actions =
    cancellable(booking.status) && !inCar
      ? [{ label: t('bookings.cancel'), onClick: () => void cancel() }]
      : [];
  const openChat = () => setTalk({ key: booking.chatKey, title: booking.trip.driver.firstName });
  return (
    <BookingScreen booking={booking} side="passenger" onBack={() => onClose(false)} actions={actions}>
      <ActionFailure error={failure} />
      <AnswerDeadline booking={booking} />
      <TripTools
        booking={booking}
        onChat={openChat}
        onComplain={() => setComplaint(booking.id)}
        onTold={setTold}
      />
    </BookingScreen>
  );
}
