import { ApiError } from '@platform/api-client';
import { commissionFor } from '@platform/brands';
import type { RideRequest } from '@platform/contracts';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Stepper } from '../find/stepper';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { BoardSheet } from './board-sheet';
import { draftOf, keepDraft } from './offer-draft';
import { useEnds } from './ends';
import { useRequestDay } from './request-day';
import { TimeChips, useOfferTime } from './time-chips';

type Props = {
  readonly request: RideRequest | null;
  readonly onClose: () => void;
  readonly onSent: () => void;
  // The wallet holds less than the commission: the way to top up (docs/12).
  readonly onShort: (commission: number) => void;
};

// «Taklif yuborish» (G64, mockup g64/1 phone 3): only the time and the price; the price starts from
// the passenger's own and moves by the step of the formula inside its bounds (docs/09).
export function OfferSheet({ request, ...props }: Props) {
  return (
    <BoardSheet open={request !== null} kind="offer" onClose={props.onClose}>
      {request ? <OfferForm request={request} {...props} /> : null}
    </BoardSheet>
  );
}

function OfferForm({ request, onSent, onShort }: Omit<Props, 'request'> & { readonly request: RideRequest }) {
  const { t, formatNumber } = useI18n();
  const { track } = useAnalytics();
  const { market, bookings } = useApiClients();
  const { commission } = useBrand();
  const day = useRequestDay();
  const ends = useEnds()(request);
  const when = useOfferTime(request);
  const bounds = useLoad(() => market.recommend(request.from, request.to)).value;
  const { failure, fail, clear } = useFailure();
  const [asked, setAsked] = useState(() => draftOf('price', request.id) ?? request.price);
  const price = bounds ? Math.min(bounds.maxPrice, Math.max(bounds.minPrice, asked)) : asked;
  const name = request.passenger.firstName;
  const step = (by: -1 | 1) => {
    if (!bounds) return;
    keepDraft('price', request.id, price + by * bounds.roundStep);
    setAsked(price + by * bounds.roundStep);
  };
  const send = async () => {
    if (!when?.departAt) return;
    clear();
    try {
      await bookings.sendOffer(request.id, { departAt: when.departAt, price });
      track({ name: 'booking_step', screen: 'requests.offer', step: 'offer_sent' });
      haptic.success();
      onSent();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough')
        onShort(commissionFor(commission, price, request.seats));
      else fail(caught);
    }
  };
  return (
    <>
      <b className="board-sheet-title">{t('requests.offer.title', { name })}</b>
      <span className="board-sheet-sub">
        {t('requests.offer.sub', { ...ends, day: day(request.date), count: String(request.seats) })}
      </span>
      <span className="board-sheet-label">{t('market.when.title')}</span>
      {when ? <TimeChips when={when} /> : <span className="time-chips" />}
      <span className="board-sheet-label">{t('market.price.title')}</span>
      <div className="board-sheet-price">
        <span>{t('requests.offer.theirPrice', { name, price: formatNumber(request.price) })}</span>
        <Stepper
          value={formatNumber(price)}
          atLeast={!bounds || price <= bounds.minPrice}
          atMost={!bounds || price >= bounds.maxPrice}
          onStep={step}
        />
      </div>
      <ActionFailure error={failure} />
      {when?.departAt && bounds ? <MainButton text={t('bookings.offer.send')} onClick={send} /> : null}
    </>
  );
}
