import type { Trip } from '@platform/contracts';
import { useState } from 'react';
import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { carLabel } from '../driver/car-choices';
import { useDriver } from '../driver/driver-context';
import { usePlaceNames } from '../places/place-names';
import type { Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import type { useNewTrip } from './new-trip-state';
import { PitakScreen } from './pitak-screen';
import { usePlaces } from './places-gate';
import { tripValues } from './trip-draft';
import { TripForm } from './trip-form';
import { TripRuleStep } from './trip-rule-step';
import { CommentStep } from './trip-steps';
import { useSchedule } from './use-schedule';
import { WhenStep } from './when-step';

type Props = {
  readonly flow: ReturnType<typeof useNewTrip>;
  readonly route: Route;
  readonly onBack: () => void;
  readonly onPublished: (trip: Trip) => void;
};

// The one screen of a new trip on its route and the screens it opens and comes back from (G63,
// docs/118 path 6): the day and time, the rule of the whole car, the comment, the pitak on the map.
// It waits for the price, the pitak and the busy times of the route with «Назад» (docs/94 B3).
export function TripOnRoute({ flow, route, onBack, onPublished }: Props) {
  const { screen, answer, recommendation, pitak, open, change, back } = flow;
  const { t } = useI18n();
  const [now] = useState(Date.now);
  const schedule = useSchedule(route.from.id, route.to.id);
  const rules = useBrand().schedule;
  const car = useDriver()?.application.car ?? null;
  const isMan = useAccount()?.profile.gender === 'male';
  const places = usePlaces();
  const names = usePlaceNames(places);
  if (!recommendation || pitak === undefined || !schedule) return <ScreenSkeleton onBack={onBack} />;
  const carSeats = car?.seats ?? 1;
  const known = { now, schedule, rules, recommendation, pitak, carSeats, isMan };
  const values = tripValues({ ...answer, route }, known);
  const region = (route.to.parentId === null ? undefined : places.find(route.to.parentId)) ?? route.to;
  const direction = names.short(region);
  if (screen === 'when')
    return (
      <WhenStep
        now={now}
        schedule={schedule}
        initial={{ date: values.date, ...(values.time ? { time: values.time } : {}) }}
        onBack={() => back()}
        onDone={({ date, time }) => back({ date, time })}
      />
    );
  if (screen === 'rule')
    return (
      <TripRuleStep
        model={car ? carLabel(car) : ''}
        seats={values.seats}
        price={values.price}
        selected={values.bookingRule}
        onBack={() => back()}
        onDone={(bookingRule) => back({ bookingRule })}
      />
    );
  if (screen === 'comment')
    return (
      <CommentStep
        initial={values.comment}
        onType={(comment) => change({ comment })}
        onBack={() => back()}
        onDone={(comment) => back({ comment })}
      />
    );
  if (screen === 'pitak' && pitak)
    return <PitakScreen pitak={pitak} hint={t('way.trip.pitak', { direction })} onBack={() => back()} />;
  return (
    <TripForm
      route={route}
      values={values}
      car={car}
      carSeats={carSeats}
      recommendation={recommendation}
      pitak={pitak}
      direction={direction}
      now={now}
      onChange={change}
      onOpen={open}
      onBack={onBack}
      onPublished={onPublished}
    />
  );
}
