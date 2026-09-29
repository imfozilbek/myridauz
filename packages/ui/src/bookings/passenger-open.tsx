import type { Booking, Offer, RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { RequestScreen } from '../market/request-card';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { ChatScreen } from '../chat/chat-screen';
import { ComplaintScreen } from '../feedback/complaint-screen';
import { BookingScreen } from './booking-screen';
import { cancellable } from './booking-status';
import { OfferScreen, OffersSection } from './offer-list';
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
export function PassengerOpen({ opened, offers, onClose }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { bookings, market } = useApiClients();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [talk, setTalk] = useState<{ readonly key: string; readonly title: string } | null>(null);
  const [complaint, setComplaint] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>, after: () => void) => {
    try {
      await action();
      haptic.success();
      after();
    } catch {
      haptic.error();
      onClose(true);
    }
  };
  if (accepted) {
    return (
      <StepLayout
        icon="selected"
        title={t('bookings.offer.accepted.title')}
        hint={t('bookings.offer.accepted.hint')}
      >
        <MainButton text={t('market.done')} onClick={() => onClose(true)} />
      </StepLayout>
    );
  }
  if (complaint) return <ComplaintScreen bookingId={complaint} onBack={() => setComplaint(null)} />;
  if (talk) return <ChatScreen chatKey={talk.key} title={talk.title} onBack={() => setTalk(null)} />;
  if (offer) {
    const answer = (action: 'accept' | 'decline') =>
      void run(
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
        onBack={() => setOffer(null)}
        onAccept={() => answer('accept')}
        onDecline={() => answer('decline')}
        onChat={() => setTalk({ key: offer.chatKey, title: offer.driver.firstName })}
      />
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
        {request.status === 'open' ? <OffersSection offers={mine} onOpen={setOffer} /> : null}
      </RequestScreen>
    );
  }
  const { booking } = opened;
  const cancel = () =>
    void run(
      () => bookings.cancelMine(booking.id),
      () => {
        track({ name: 'booking_step', screen: 'bookings.passenger', step: 'cancelled' });
        onClose(true);
      },
    );
  const actions = cancellable(booking.status) ? [{ label: t('bookings.cancel'), onClick: cancel }] : [];
  const openChat = () => setTalk({ key: booking.chatKey, title: booking.trip.driver.firstName });
  return (
    <BookingScreen booking={booking} side="passenger" onBack={() => onClose(false)} actions={actions}>
      <TripTools booking={booking} onChat={openChat} onComplain={() => setComplaint(booking.id)} />
    </BookingScreen>
  );
}
