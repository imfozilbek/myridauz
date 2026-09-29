import { REQUEST_MAX_SEATS, type Recommendation } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CellValue } from '../account/cell-value';
import { StepLayout } from '../account/step-layout';
import { Cell, List, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ChoiceStep } from '../driver/steps/choice-step';
import { RouteScreen, type Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DateStep } from './date-step';
import { errorKey } from './error-text';
import { PriceStep } from './price-step';
import { noonOf } from './when';

type Step = 'route' | 'date' | 'seats' | 'price' | 'review' | 'done';
type Draft = { route?: Route; date?: string; seats?: number; price?: number };
const SEATS = Array.from({ length: REQUEST_MAX_SEATS }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));

// "Soʻrov qoldirish": where, which day, how many people, the price (docs/09). Drivers find it.
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
  const { route, date, seats, price } = draft;
  useEffect(() => {
    if (route) market.recommend(route.from.id, route.to.id).then(setRecommendation, () => setStep('route'));
  }, [route, market]);
  const publish = async () => {
    if (!route || !date || !seats || !price) return;
    setError(null);
    try {
      await market.publishRequest({ from: route.from.id, to: route.to.id, date, seats, price });
      haptic.success();
      setStep('done');
    } catch (caught) {
      haptic.error();
      setError(errorKey(caught));
    }
  };

  if (step === 'route')
    return (
      <RouteScreen
        allowWholeRegion={false}
        onBack={onBack}
        onDone={(value) => next({ route: value }, 'date')}
      />
    );
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
    if (!recommendation) return <ScreenSkeleton />;
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
    <StepLayout icon="request" title={t('market.request.review.title')}>
      <BackButton onClick={() => setStep('price')} />
      <List>
        <Section>
          <Cell multiline description={route ? `${route.from.name} → ${route.to.name}` : ''}>
            {t('market.review.route')}
          </Cell>
          {line(t('market.review.when'), date ? formatDate(noonOf(date)) : '')}
          {line(t('market.requestSeats.title'), String(seats ?? 1))}
          {line(t('market.review.price'), formatMoney(price ?? 0))}
        </Section>
      </List>
      {error ? <Text className="step-error">{t(error)}</Text> : null}
      <MainButton text={t('market.request.publish')} onClick={() => void publish()} />
    </StepLayout>
  );
}
