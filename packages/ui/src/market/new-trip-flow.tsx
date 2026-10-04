import { useState, type ReactNode } from 'react';
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
import { SeatsStep } from './seats-step';
import { TripLimitScreen, useTripLimitReached } from './trip-limit';
import { CommentStep } from './trip-steps';
import { TripModeStep } from './trip-mode-step';
import { completeDraft, type TripAgain } from './trip-draft';

type NewTripFlowProps = {
  readonly onBack: () => void;
  readonly route?: Route;
  // The day of the requests the driver looked at: the day step opens on it (G37, docs/101 R4).
  readonly date?: string;
  // «Oxirgi yoʻnalish»: the last trip again, only the day is asked (G40, docs/106 K3).
  readonly again?: TripAgain;
};

// A new trip, one question per screen (docs/19): the answers of a step open the next one, «Назад»
// shows each earlier step with its answer (docs/94 F8), a closed app comes back to it (F3).
export function NewTripFlow(props: NewTripFlowProps) {
  const flow = useNewTrip(props.route, props.date, props.again);
  const limitReached = useTripLimitReached();
  if (limitReached) return <TripLimitScreen onBack={props.onBack} />;
  return (
    <>
      <TripStepScreen {...props} flow={flow} />
      <DraftRestored shown={flow.restored} />
    </>
  );
}

function TripStepScreen({
  onBack,
  flow,
}: NewTripFlowProps & { readonly flow: ReturnType<typeof useNewTrip> }): ReactNode {
  const car = useDriver()?.application.car;
  const woman = useAccount()?.profile.gender === 'female';
  const { step, answer: draft, recommendation, kind, go, next } = flow;
  const { route } = draft;
  // The way step was skipped (no pitak): «Назад» from the day goes to the route (G40, docs/106 K2).
  const [modeSkipped, setModeSkipped] = useState(false);
  switch (step) {
    case 'route':
      return (
        <RouteScreen
          allowWholeRegion={false}
          quick
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
          onSkip={() => {
            setModeSkipped(true);
            next('mode', { pickupMode: 'door' }, 'when');
          }}
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
          onBack={() => go(kind !== 'new' || modeSkipped ? 'route' : 'mode')}
          onDone={(when) => next('when', when, kind === 'new' ? 'seats' : 'review')}
        />
      ) : null;
    case 'seats':
      return (
        <SeatsStep
          max={car?.seats ?? 1}
          initial={{ seats: draft.seats ?? car?.seats ?? 1, womanOnBoard: draft.womanOnBoard ?? false }}
          askWoman={!woman}
          onBack={() => go('when')}
          onDone={(value) => next('seats', value, 'price')}
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
          onDone={(price) => next('price', { price }, 'comment')}
        />
      );
    case 'comment':
      return (
        <CommentStep
          initial={draft.comment ?? ''}
          onType={flow.type}
          onBack={() => go('price')}
          onDone={(comment) => next('comment', { comment }, 'review')}
        />
      );
    default: {
      // The way back has no comment of its own; the last trip again can change any answer.
      const back = () => go(kind === 'return' ? 'when' : 'comment');
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
            isReturn={kind === 'return'}
            onReturn={() => flow.startReturn(complete)}
          />
        </PlacesGate>
      );
    }
  }
}
