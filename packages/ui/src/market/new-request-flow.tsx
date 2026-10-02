import { REQUEST_MAX_SEATS, type Recommendation } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import type { Way } from '../way/way-end';
import { WayScreen } from '../way/way-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DateStep } from './date-step';
import { errorKey } from './error-text';
import { useStepProgress } from '../flow/step-progress';
import { PlacesGate } from './places-gate';
import { PriceStep } from './price-step';
import { RouteView } from './route-view';
import { noonOf } from './when';

const STEPS = ['route', 'date', 'seats', 'price', 'review'] as const;
type Step = (typeof STEPS)[number] | 'done';
type Draft = { way?: Way; date?: string; seats?: number; price?: number };
const SEATS = Array.from({ length: REQUEST_MAX_SEATS }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

// "Soʻrov qoldirish": the start and the end over the map with the way of pickup (docs/70, docs/71),
// which day, how many people, the price (docs/09). Drivers find it.
export function NewRequestFlow({ onBack }: { readonly onBack: () => void }) {
  const { t, formatMoney, formatDate } = useI18n();
  const { market } = useApiClients();
  const [step, setStep] = useState<Step>('route');
  const [draft, setDraft] = useState<Draft>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const [now] = useState(Date.now);
  const next = (patch: Draft, to: Step) => {
    setDraft((value) => ({ ...value, ...patch }));
    setStep(to);
  };
  useStepProgress(step === 'done' ? -1 : STEPS.indexOf(step), STEPS.length);
  const { way, date, seats, price } = draft;
  useEffect(() => {
    if (way)
      market.recommend(way.from.place.id, way.to.place.id).then(setRecommendation, () => setStep('route'));
  }, [way, market]);
  const publish = async () => {
    const dropoff = way?.to.point;
    if (!way || !dropoff || !date || !seats || !price) return;
    setError(null);
    try {
      const { from, to, mode } = way;
      const where = { pickupMode: mode, pickup: mode === 'pitak' ? null : from.point, dropoff };
      await market.publishRequest({ from: from.place.id, to: to.place.id, date, seats, price, ...where });
      haptic.success();
      setStep('done');
    } catch (caught) {
      haptic.error();
      setError(errorKey(caught));
    }
  };

  if (step === 'route') return <WayScreen onBack={onBack} onDone={(value) => next({ way: value }, 'date')} />;
  if (step === 'date')
    return (
      <DateStep
        now={now}
        onBack={() => setStep('route')}
        onDone={(value) => next({ date: value }, 'seats')}
      />
    );
  if (step === 'seats') {
    return (
      <ChoiceStep
        screen="market.request_seats"
        icon="passengers"
        title={t('market.requestSeats.title')}
        choices={SEATS}
        selected={seats ?? 1}
        onBack={() => setStep('date')}
        onDone={(value) => next({ seats: value }, 'price')}
      />
    );
  }
  if (step === 'price') {
    if (!recommendation) return <ScreenSkeleton onBack={() => setStep('seats')} />;
    const initial = price ? { initial: price } : {};
    return (
      <PriceStep
        recommendation={recommendation}
        {...initial}
        onBack={() => setStep('seats')}
        onDone={(value) => next({ price: value }, 'review')}
      />
    );
  }
  if (step === 'done') {
    return (
      <StepLayout
        icon="selected"
        title={t('market.request.published.title')}
        hint={t('market.request.published.hint')}
      >
        <MainButton text={t('market.done')} onClick={onBack} />
      </StepLayout>
    );
  }
  const line = (label: string, value: string) => <Cell after={<CellValue>{value}</CellValue>}>{label}</Cell>;
  return (
    <PlacesGate>
      <StepLayout
        icon="request"
        title={t('market.request.review.title')}
        hint={t('market.request.review.hint')}
      >
        <BackButton onClick={() => setStep('price')} />
        <List>
          <Section>
            {way ? (
              <div className="route-summary">
                <RouteView from={way.from.place.id} to={way.to.place.id} />
              </div>
            ) : null}
            {line(t('market.review.when'), date ? formatDate(noonOf(date)) : '')}
            {line(t('market.requestSeats.title'), String(seats ?? 1))}
            {line(t('market.review.price'), formatMoney(price ?? 0))}
          </Section>
        </List>
        {error ? <Text className="step-error">{t(error)}</Text> : null}
        <MainButton text={t('market.request.publish')} onClick={publish} />
      </StepLayout>
    </PlacesGate>
  );
}
