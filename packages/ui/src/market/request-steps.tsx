import type { Location } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { BookPoint } from '../bookings/book-point';
import { useI18n } from '../context/i18n-context';
import { useGoHome } from '../flow/home-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { Screen } from '../screen/screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { MainButton } from '../telegram/bottom-button';
import { rememberedWay } from '../way/remembered-way';
import { DateStep } from './date-step';
import { keptWay, type useNewRequest } from './new-request-state';
import { rememberRoute } from './recent-routes';
import { RequestPoints } from './request-points';

export type Search = { readonly route: Route; readonly date: string };
export type Find = (id: string) => Location | undefined;

type StepProps = {
  readonly flow: ReturnType<typeof useNewRequest>;
  readonly find: Find;
  readonly search: Search | undefined;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

// One step of a request (G61, docs/118 path 4): the route, the day, then one screen with the maps
// of its ends. Each shows the answer chosen before (docs/94 F8).
export function RequestStep({ flow, find, search, onBack, onClose }: StepProps) {
  const { t } = useI18n();
  const home = useGoHome(onClose);
  const { step, answer, recommendation, pitak, go, next } = flow;
  const [now] = useState(Date.now);
  const { route, date, mode, pickup, dropoff } = answer;
  if (flow.sent)
    return (
      <StepLayout
        hero
        icon="selected"
        title={t('market.request.published.title')}
        hint={t('market.request.published.hint')}
      >
        <Screen onBack={home} />
        <MainButton text={t('market.done')} onClick={home} />
      </StepLayout>
    );
  if (step === 'route' || !route)
    return (
      <RouteScreen
        allowWholeRegion={false}
        quick
        {...(route ? { initial: route } : { pick: 'to' as const })}
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
