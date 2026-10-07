import { commissionFor } from '@platform/brands';
import { ApiError } from '@platform/api-client';
import type { Recommendation, RideRequest } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useDriver } from '../driver/driver-context';
import { useI18n } from '../context/i18n-context';
import { errorKey } from '../market/error-text';
import { PriceStep } from '../market/price-step';
import { RouteView } from '../market/route-view';
import { TripWhen } from '../market/trip-when';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useGoHome } from '../flow/home-context';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { NotEnoughScreen, TopUpScreen } from './wallet-steps';

type Props = { readonly request: RideRequest; readonly onBack: () => void; readonly onClose: () => void };
type Money = 'not_enough' | 'top_up' | null;
type Step = 'time' | 'price' | 'review';
type Time = { readonly at: number; readonly time: string };

// A driver offers a time and a price on a request (docs/35): the time on the request's day,
// the recommended price, a check with the commission. The passenger accepts or declines.
// «Назад» shows the time and the price chosen before (docs/94 F8).
export function OfferFlow({ request, onBack, onClose }: Props) {
  const { t, formatMoney } = useI18n();
  const { track } = useAnalytics();
  const { market, bookings } = useApiClients();
  const { commission } = useBrand();
  const car = useDriver()?.application.car;
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [step, setStep] = useState<Step>('time');
  const [time, setTime] = useState<Time | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [money, setMoney] = useState<Money>(null);
  const [sent, setSent] = useState(false);
  const home = useGoHome(onClose);
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  useEffect(() => {
    market.recommend(request.from, request.to).then(setRecommendation, onBack);
  }, []);
  if (sent) {
    return (
      <StepLayout
        hero
        icon="selected"
        title={t('bookings.offer.sent.title')}
        hint={t('bookings.offer.sent.hint')}
      >
        <Screen onBack={home} />
        <MainButton text={t('market.done')} onClick={home} />
      </StepLayout>
    );
  }
  if (!recommendation) return <ScreenSkeleton onBack={onBack} />;
  if (step === 'time' || !time) {
    return (
      <TripWhen
        from={request.from}
        to={request.to}
        fixedDate={request.date}
        {...(time ? { initial: { date: request.date, time: time.time } } : {})}
        onBack={onBack}
        onDone={(when) => {
          setTime({ at: when.departAt, time: when.time });
          setStep('price');
        }}
      />
    );
  }
  if (step === 'price' || price === null) {
    return (
      <PriceStep
        recommendation={recommendation}
        // The price the passenger asked for first: an offer at it is taken more often (G40, docs/106 K5).
        initial={price ?? request.price}
        commission
        onBack={() => setStep('time')}
        onDone={(value) => {
          setPrice(value);
          setStep('review');
        }}
      />
    );
  }
  const departAt = time.at;
  // «Boʻsh salon kerak»: the offer takes every seat of the car, each at the price of a seat (G61).
  const seats = request.wholeCar ? (car?.seats ?? request.seats) : request.seats;
  const fee = commissionFor(commission, price, seats);
  if (money === 'top_up') return <TopUpScreen onBack={() => setMoney('not_enough')} />;
  if (money === 'not_enough')
    return <NotEnoughScreen amount={fee} onBack={() => setMoney(null)} onTopUp={() => setMoney('top_up')} />;
  const send = async () => {
    setError(null);
    try {
      await bookings.sendOffer(request.id, { departAt, price });
      track({ name: 'booking_step', screen: 'bookings.offer_review', step: 'offer_sent' });
      haptic.success();
      setSent(true);
    } catch (caught) {
      haptic.error();
      if (caught instanceof ApiError && caught.code === 'wallet.not_enough') setMoney('not_enough');
      else setError(errorKey(caught));
    }
  };
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <StepLayout
      icon="myTrips"
      title={t('bookings.offer.review.title')}
      hint={t('bookings.offer.review.hint')}
    >
      <Screen onBack={() => setStep('price')} />
      <List>
        <Section>
          <div className="route-summary">
            <RouteView from={request.from} to={request.to} departAt={departAt} km={recommendation.km} />
          </div>
          {line(t(request.wholeCar ? 'find.wholeCar' : 'bookings.review.seats'), String(seats))}
          {line(t('market.review.price'), formatMoney(price))}
          {line(t('bookings.offer.commission'), formatMoney(fee))}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(error)}</Text> : null}
      <MainButton text={t('bookings.offer.send')} onClick={send} />
    </StepLayout>
  );
}
