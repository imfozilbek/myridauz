import type { Recommendation, TripStep } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useAccount } from '../account/account-context';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useDriver } from '../driver/driver-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { DateStep } from './date-step';
import { PriceStep } from './price-step';
import { TimeStep } from './time-step';
import { TripPublish } from './trip-publish';
import { CommentStep, SeatsStep, WomanStep } from './trip-steps';

type Step = 'route' | 'date' | 'time' | 'seats' | 'price' | 'woman' | 'comment' | 'review';
export type TripDraft = {
  readonly route: Route;
  readonly date: string;
  readonly time: string;
  readonly departAt: number;
  readonly seats: number;
  readonly price: number;
  readonly womanOnBoard: boolean;
  readonly comment: string;
};

// Every answer is there: the review can show and publish it. A woman driver skips the woman step.
function completeDraft(draft: Partial<TripDraft>): TripDraft | null {
  const { route, date, time, departAt, seats, price, comment } = draft;
  if (!route || !date || !time || !departAt || !seats || !price || comment === undefined) return null;
  return { route, date, time, departAt, seats, price, comment, womanOnBoard: draft.womanOnBoard ?? false };
}

// A new trip, one question per screen (docs/19): the answers of a step open the next one.
export function NewTripFlow({ onBack }: { readonly onBack: () => void }) {
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const car = useDriver()?.application.car;
  const woman = useAccount()?.profile.gender === 'female';
  const [step, setStep] = useState<Step>('route');
  const [draft, setDraft] = useState<Partial<TripDraft>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [now] = useState(Date.now);
  const next = (passed: TripStep, patch: Partial<TripDraft>, to: Step) => {
    track({ name: 'trip_step', screen: `market.${passed}`, step: passed });
    setDraft((value) => ({ ...value, ...patch }));
    setStep(to);
  };
  const { route } = draft;
  useEffect(() => {
    if (!route) return;
    setRecommendation(null);
    market.recommend(route.from.id, route.to.id).then(setRecommendation, () => setStep('route'));
  }, [route, market]);

  switch (step) {
    case 'route':
      return (
        <RouteScreen
          allowWholeRegion={false}
          onBack={onBack}
          onDone={(value) => next('route', { route: value }, 'date')}
        />
      );
    case 'date':
      return (
        <DateStep
          now={now}
          onBack={() => setStep('route')}
          onDone={(date) => next('date', { date }, 'time')}
        />
      );
    case 'time':
      return (
        <TimeStep
          date={draft.date ?? ''}
          now={Date.now()}
          {...(draft.time ? { initial: draft.time } : {})}
          onBack={() => setStep('date')}
          onDone={(departAt, time) => next('time', { departAt, time }, 'seats')}
        />
      );
    case 'seats':
      return (
        <SeatsStep
          max={car?.seats ?? 1}
          initial={draft.seats ?? car?.seats ?? 1}
          onBack={() => setStep('time')}
          onDone={(seats) => next('seats', { seats }, 'price')}
        />
      );
    case 'price':
      if (!recommendation) return <ScreenSkeleton />;
      return (
        <PriceStep
          recommendation={recommendation}
          {...(draft.price ? { initial: draft.price } : {})}
          onBack={() => setStep('seats')}
          onDone={(price) => next('price', { price }, woman ? 'comment' : 'woman')}
        />
      );
    case 'woman':
      return (
        <WomanStep
          onBack={() => setStep('price')}
          onDone={(value) => next('woman', { womanOnBoard: value }, 'comment')}
        />
      );
    case 'comment':
      return (
        <CommentStep
          initial={draft.comment ?? ''}
          onBack={() => setStep(woman ? 'price' : 'woman')}
          onDone={(comment) => next('comment', { comment }, 'review')}
        />
      );
    default: {
      const complete = completeDraft(draft);
      return complete ? (
        <TripPublish draft={complete} onBack={() => setStep('comment')} onClose={onBack} />
      ) : null;
    }
  }
}
