import type { Location } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { BookPoint } from '../bookings/book-point';
import { useI18n } from '../context/i18n-context';
import { RouteScreen, type Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { Screen } from '../screen/screen';
import { useGoHome } from '../flow/home-context';
import { MainButton } from '../telegram/bottom-button';
import { rememberedWay } from '../way/remembered-way';
import { DateStep } from './date-step';
import type { RequestStepName, useNewRequest } from './new-request-state';
import { PriceStep } from './price-step';
import { RequestModeStep } from './request-mode-step';
import { RequestReview } from './request-review';

export type Search = { readonly route: Route; readonly date: string };
export type Find = (id: string) => Location | undefined;

type StepProps = {
  readonly flow: ReturnType<typeof useNewRequest>;
  readonly find: Find;
  readonly search: Search | undefined;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

// One step of a request; each shows the answer chosen before (docs/94 F8).
export function RequestStep({ flow, find, search, onBack, onClose }: StepProps) {
  const { t } = useI18n();
  const home = useGoHome(onClose);
  const { step, answer, recommendation, pitak, editing, go, next } = flow;
  const [now] = useState(Date.now);
  const { route, date, mode, pickup, dropoff, price } = answer;
  // «Назад»: to the check from a step it opened, else to the step before; the first goes out.
  const back = (to: RequestStepName | null) => () => (editing ? go('review') : to ? go(to) : onBack());
  const beforeWay = search ? null : 'date';
  const beforePoints = pitak ? 'mode' : beforeWay;
  // No pitak on the direction: the door, without a choice of one (PS8).
  useEffect(() => void (step === 'mode' && pitak === null && next({ mode: 'door' })), [step, pitak]);
  if (flow.sent)
    return (
      <StepLayout
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
          const kept = rememberedWay(chosen.from.id, chosen.to.id, find);
          next({ route: chosen, ...(kept ?? {}) });
        }}
      />
    );
  if (step === 'date')
    return (
      <DateStep
        now={now}
        {...(date ? { initial: date } : {})}
        onBack={back('route')}
        onDone={(value) => next({ date: value })}
      />
    );
  if (step === 'mode') {
    if (!pitak) return <ScreenSkeleton onBack={back(beforeWay)} />;
    return (
      <RequestModeStep
        pitak={pitak}
        selected={mode}
        onBack={back(beforeWay)}
        onDone={(value) => next({ mode: value, ...(value === 'pitak' ? { pickup: null } : {}) })}
      />
    );
  }
  if (step === 'pickup')
    return (
      <BookPoint
        placeId={route.from.id}
        end="from"
        initial={pickup ?? null}
        onBack={back(beforePoints)}
        onPick={(end) => next({ pickup: end })}
      />
    );
  if (step === 'dropoff')
    return (
      <BookPoint
        placeId={route.to.id}
        end="to"
        initial={dropoff ?? null}
        onBack={back(mode === 'pitak' ? beforePoints : 'pickup')}
        onPick={(end) => next({ dropoff: end })}
      />
    );
  if (step === 'price') {
    if (!recommendation) return <ScreenSkeleton onBack={back('dropoff')} />;
    return (
      <PriceStep
        recommendation={recommendation}
        {...(price ? { initial: price } : {})}
        onBack={back('dropoff')}
        onDone={(value) => next({ price: value })}
      />
    );
  }
  return (
    <RequestReview
      answer={answer}
      pitak={pitak}
      onSeats={(seats) => next({ seats })}
      onChange={(to) => go(to, true)}
      onBack={back('price')}
      onSent={flow.done}
    />
  );
}
