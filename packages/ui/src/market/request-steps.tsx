import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { BookPoint } from '../bookings/book-point';
import { useGoHome } from '../flow/home-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { rememberedWay } from '../way/remembered-way';
import { DateStep } from './date-step';
import { ExistingRequest } from './existing-request';
import { keptWay, type useNewRequest } from './new-request-state';
import { PlacesGate } from './places-gate';
import { rememberRoute } from './recent-routes';
import { RequestPoints } from './request-points';

export type Search = { readonly route: Route; readonly date: string };
export type Find = (id: string) => Location | undefined;

type StepProps = {
  readonly flow: ReturnType<typeof useNewRequest>;
  readonly find: Find;
  readonly search: Search | undefined;
  // The ends of the main screen (G76): the route starts from them.
  readonly from?: Location | undefined;
  readonly to?: Location | undefined;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

// One step of a request (G61, docs/118 path 4): the route, the day, then one screen with the maps
// of its ends. Each shows the answer chosen before (docs/94 F8).
export function RequestStep({ flow, find, search, from, to, onBack, onClose }: StepProps) {
  const home = useGoHome(onClose);
  const { step, answer, recommendation, pitak, go, next } = flow;
  const [now] = useState(Date.now);
  const { route, date, mode, pickup, dropoff } = answer;
  // Sent: «Mening soʻrovim» at once, the offers come into it (G61, journey screens 2 and 5).
  if (flow.sent && route && date)
    return (
      <PlacesGate onBack={home}>
        <ExistingRequest from={route.from.id} to={route.to.id} date={date} onClose={home} />
      </PlacesGate>
    );
  if (step === 'route' || !route)
    return (
      <RouteScreen
        allowWholeRegion={false}
        quick
        {...(route
          ? { initial: route }
          : from && to
            ? { initial: { from, to } }
            : { pick: 'to' as const, ...(from ? { from } : {}) })}
        onBack={onBack}
        onDone={(chosen) => {
          // The route of a request is one tap away on the main screen next time (G40, docs/106 K9).
          rememberRoute(chosen);
          next({ route: chosen, ...keptWay(rememberedWay(chosen.from.id, chosen.to.id, find)) });
        }}
      />
    );
  if (step === 'date' || !date)
    return (
      <DateStep
        now={now}
        {...(date ? { initial: date } : {})}
        onBack={() => go('route')}
        onDone={(value) => next({ date: value })}
      />
    );
  const toPoints = () => go('points');
  if (step === 'pickup')
    return (
      <BookPoint
        placeId={route.from.id}
        end="from"
        initial={pickup ?? null}
        // The pitak of the direction is one more start, taken in one tap (docs/70, docs/72).
        {...(pitak && mode !== 'pitak'
          ? { pitak, onPitak: () => next({ mode: 'pitak', pickup: null }) }
          : {})}
        onBack={toPoints}
        onPick={(end) => next({ mode: 'door', pickup: end })}
      />
    );
  if (step === 'dropoff')
    return (
      <BookPoint
        placeId={route.to.id}
        end="to"
        initial={dropoff ?? null}
        onBack={toPoints}
        onPick={(end) => next({ dropoff: end })}
      />
    );
  if (!recommendation) return <ScreenSkeleton onBack={search ? onBack : () => go('date')} />;
  return (
    <RequestPoints
      answer={answer}
      recommendation={recommendation}
      pitak={pitak}
      onAnswer={next}
      onEnd={go}
      onBack={search ? onBack : () => go('date')}
      onSent={flow.done}
    />
  );
}
