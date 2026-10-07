import type { Offer, RideRequest } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { usePlaces } from '../market/places-gate';
import { useShortDay } from '../market/when';
import { Screen } from '../screen/screen';
import { ActionFailure } from '../states/action-failure';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { OfferCard } from './offer-card';
import { WaitingChannel } from './waiting-channel';
import './my-request.css';

type Props = {
  readonly request: RideRequest;
  readonly offers: readonly Offer[];
  readonly failure: TranslationKey | null;
  readonly onBack: () => void;
  readonly onCancel: () => void;
  readonly onAnswer: (offer: Offer, action: 'accept' | 'decline') => Promise<unknown>;
  readonly onOpen: (offer: Offer) => void;
};

// «Mening soʻrovim» (G61, docs/118 path 4, mockup 3-offers A): the request on one line, the offers
// of the drivers with «Rad etish» and «Qabul qilish», the channel while waiting, the cancel below.
export function MyRequest({ request, offers, failure, onBack, onCancel, onAnswer, onOpen }: Props) {
  useScreenView('market.request');
  useScreenBackground();
  const { t, formatNumber } = useI18n();
  const shortDay = useShortDay();
  const [now] = useState(Date.now);
  const { colors } = useBrand().theme;
  const directory = usePlaces();
  const open = request.status === 'open';
  const waiting = offers.filter((item) => item.requestId === request.id && item.status === 'sent');
  const name = (id: string) => directory.find(id)?.name ?? id;
  const facts = [
    t('market.request.seats', { count: String(request.seats) }),
    t('bookings.request.perSeat', { price: formatNumber(request.price) }),
    ...(request.wholeCar ? [t('market.request.wholeCar')] : []),
  ];
  return (
    <div className="find my-request" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <div className="my-request-line">
        <span className="my-request-route">
          {t('market.request.sub', {
            route: t('common.route', { from: name(request.from), to: name(request.to) }),
            day: shortDay(request.date, now),
          })}
        </span>
        <span className="my-request-facts">
          {open ? facts.join(' · ') : t(`market.status.${request.status}`)}
        </span>
      </div>
      <ActionFailure error={failure} />
      {open && waiting.length > 0 ? (
        <>
          <p className="find-head my-request-head">
            {t('bookings.request.offers', { count: String(waiting.length) })}
          </p>
          {waiting.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onAnswer={(action) => onAnswer(offer, action)}
              onOpen={() => onOpen(offer)}
            />
          ))}
        </>
      ) : null}
      {open ? <WaitingChannel request={request} /> : null}
      {open ? (
        <button type="button" className="my-request-cancel" onClick={onCancel}>
          {t('market.request.cancel')}
        </button>
      ) : null}
    </div>
  );
}
