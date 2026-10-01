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
import { PlacesGate } from './places-gate';
import { returnDraft } from './return-trip';
import { TripPublish } from './trip-publish';
import { CommentStep, SeatsStep, WomanStep } from './trip-steps';
import { TripModeStep } from './trip-mode-step';
import { completeDraft, type TripDraft } from './trip-draft';

type Step = 'route' | 'mode' | 'date' | 'time' | 'seats' | 'price' | 'woman' | 'comment' | 'review';
// A new trip, one question per screen (docs/19): the answers of a step open the next one.
export function NewTripFlow({
  onBack,
  route: known,
  pick,
}: {
  readonly onBack: () => void;
  readonly route?: Route;
  // «Qayerga ketyapsiz?» of the main screen opens the list of the end at once (G25).
  readonly pick?: 'from' | 'to';
}) {
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const car = useDriver()?.application.car;
  const woman = useAccount()?.profile.gender === 'female';
  // «Oxirgi yoʻnalish» of the main screen brings the route: the way of pickup comes first (G25).
  const [step, setStep] = useState<Step>(known ? 'mode' : 'route');
  const [draft, setDraft] = useState<Partial<TripDraft>>(known ? { route: known } : {});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isReturn, setIsReturn] = useState(false);
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
          {...(pick && !route ? { pick } : {})}
          onBack={onBack}
          onDone={(value) => next('route', { route: value }, 'mode')}
        />
      );
    case 'mode':
      return route ? (
        <TripModeStep
          route={route}
          onBack={() => setStep('route')}
          onDone={(pickupMode) => next('mode', { pickupMode }, 'date')}
        />
      ) : null;
    case 'date':
      return (
        <DateStep
          now={now}
          onBack={() => setStep(isReturn ? 'route' : 'mode')}
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
          onDone={(departAt, time) => next('time', { departAt, time }, isReturn ? 'review' : 'seats')}
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
      if (!recommendation) return <ScreenSkeleton onBack={() => setStep('seats')} />;
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
      return complete && recommendation ? (
        <PlacesGate>
          <TripPublish
            draft={complete}
            km={recommendation.km}
            onBack={() => setStep(isReturn ? 'time' : 'comment')}
            onClose={onBack}
            isReturn={isReturn}
            onReturn={() => {
              setDraft(returnDraft(complete));
              setIsReturn(true);
              setStep('date');
            }}
          />
        </PlacesGate>
      ) : null;
    }
  }
}
