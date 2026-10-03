import type { ReactNode } from 'react';
import { useAccount } from '../account/account-context';
import { useDriver } from '../driver/driver-context';
import { DraftRestored } from '../flow/draft-restored';
import { RouteScreen, type Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useNewTrip } from './new-trip-state';
import { PriceStep } from './price-step';
import { TripWhen } from './trip-when';
import { PlacesGate } from './places-gate';
import { TripPublish } from './trip-publish';
import { CommentStep, SeatsStep, WomanStep } from './trip-steps';
import { TripModeStep } from './trip-mode-step';
import { completeDraft } from './trip-draft';

type NewTripFlowProps = {
  readonly onBack: () => void;
  readonly route?: Route;
  // «Qayerga ketyapsiz?» of the main screen opens the list of the end at once (G25).
  readonly pick?: 'from' | 'to';
  // The day of the requests the driver looked at: the day step opens on it (G37, docs/101 R4).
  readonly date?: string;
};

// A new trip, one question per screen (docs/19): the answers of a step open the next one, «Назад»
// shows each earlier step with its answer (docs/94 F8), a closed app comes back to it (F3).
export function NewTripFlow(props: NewTripFlowProps) {
  const flow = useNewTrip(props.route, props.date);
  return (
    <>
      <TripStepScreen {...props} flow={flow} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}

function TripStepScreen({
  onBack,
  pick,
  flow,
}: NewTripFlowProps & { readonly flow: ReturnType<typeof useNewTrip> }): ReactNode {
  const car = useDriver()?.application.car;
  const woman = useAccount()?.profile.gender === 'female';
  const { step, answer: draft, recommendation, isReturn, go, next } = flow;
  const { route } = draft;
  switch (step) {
    case 'route':
      return (
        <RouteScreen
          allowWholeRegion={false}
          {...(pick && !route ? { pick } : {})}
          {...(route ? { initial: route } : {})}
          onBack={onBack}
          onDone={(value) => next('route', { route: value }, 'mode')}
        />
      );
    case 'mode':
      return route ? (
        <TripModeStep
          route={route}
          {...(draft.pickupMode ? { selected: draft.pickupMode } : {})}
          onBack={() => go('route')}
          onDone={(pickupMode) => next('mode', { pickupMode }, 'when')}
        />
      ) : null;
    case 'when':
      return route ? (
        <TripWhen
          from={route.from.id}
          to={route.to.id}
          {...(draft.date
            ? { initial: { date: draft.date, ...(draft.time ? { time: draft.time } : {}) } }
            : {})}
          onBack={() => go(isReturn ? 'route' : 'mode')}
          onDone={(when) => next('when', when, isReturn ? 'review' : 'seats')}
        />
      ) : null;
    case 'seats':
      return (
        <SeatsStep
          max={car?.seats ?? 1}
          initial={draft.seats ?? car?.seats ?? 1}
          onBack={() => go('when')}
          onDone={(seats) => next('seats', { seats }, 'price')}
        />
      );
    case 'price':
      if (!recommendation) return <ScreenSkeleton onBack={() => go('seats')} />;
      return (
        <PriceStep
          recommendation={recommendation}
          {...(draft.price ? { initial: draft.price } : {})}
          commission
          onBack={() => go('seats')}
          onDone={(price) => next('price', { price }, woman ? 'comment' : 'woman')}
        />
      );
    case 'woman':
      return (
        <WomanStep
          {...(draft.womanOnBoard === undefined ? {} : { selected: draft.womanOnBoard })}
          onBack={() => go('price')}
          onDone={(value) => next('woman', { womanOnBoard: value }, 'comment')}
        />
      );
    case 'comment':
      return (
        <CommentStep
          initial={draft.comment ?? ''}
          onType={flow.type}
          onBack={() => go(woman ? 'price' : 'woman')}
          onDone={(comment) => next('comment', { comment }, 'review')}
        />
      );
    default: {
      const back = () => go(isReturn ? 'when' : 'comment');
      const complete = completeDraft(draft);
      // The way back waits for its recommendation: a skeleton with «Назад», never a blank screen (B3).
      if (!complete || !recommendation) return <ScreenSkeleton onBack={back} />;
      return (
        <PlacesGate>
          <TripPublish
            draft={complete}
            km={recommendation.km}
            onBack={back}
            onClose={onBack}
            onPublished={flow.clear}
            isReturn={isReturn}
            onReturn={() => flow.startReturn(complete)}
          />
        </PlacesGate>
      );
    }
  }
}
