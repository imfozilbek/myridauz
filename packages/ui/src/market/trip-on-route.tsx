import type { Trip } from '@platform/contracts';
import { useAccount } from '../account/account-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { carLabel } from '../driver/car-choices';
import { useDriver } from '../driver/driver-context';
import { usePlaceNames } from '../places/place-names';
import type { Route } from '../places/route-screen';
import { ScreenSkeleton } from '../states/screen-skeleton';
import { useClock } from '../own-trip/use-now';
import { regionOf } from '../way/way-end';
import type { useNewTrip } from './new-trip-state';
import { PitakScreen } from './pitak-screen';
import { usePlaces } from './places-gate';
import { tripValues } from './trip-draft';
import { TripForm } from './trip-form';
import { TripRuleStep } from './trip-rule-step';
import { CommentSheet } from './trip-steps';
import { useSchedule } from './use-schedule';
import { WhenSheet } from './when-sheet';

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
  // The time of the screen moves on while it stays open: never a time that became too soon (G77).
  const [now, tick] = useClock();
  const schedule = useSchedule();
  const rules = useBrand().schedule;
  const car = useDriver()?.application.car ?? null;
  const isMan = useAccount()?.profile.gender === 'male';
  const places = usePlaces();
  const names = usePlaceNames(places);
  if (!recommendation || pitak === undefined || !schedule) return <ScreenSkeleton onBack={onBack} />;
  const carSeats = car?.seats ?? 1;
  const known = { now, rules, recommendation, pitak, carSeats, isMan };
  const values = tripValues({ ...answer, route }, known);
  // At the tap the screen catches up with the clock: its time is the one that goes, or none (G77).
  const sending = () => (tick(), tripValues({ ...answer, route }, { ...known, now: Date.now() }));
  const region = places.find(regionOf(route.to)) ?? route.to;
  const direction = names.short(region);
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
  if (screen === 'pitak' && pitak)
    return (
      <PitakScreen
        pitak={pitak}
        hint={t('way.trip.pitak', { direction })}
        onBack={() => back()}
        // «Shu pitakdan» keeps «Ikkalasi»; the doors alone become the pitak (G75, mockup g75/6 A).
        onPitak={() => back({ pickupMode: values.pickupMode === 'door' ? 'pitak' : values.pickupMode })}
        onDoor={() => back({ pickupMode: 'door' })}
      />
    );
  return (
    <>
      <TripForm
        route={route}
        values={values}
        sending={sending}
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
      {/* The day and time and «Izoh» are sheets over the form (G75, mockup g75/3 A). */}
      <WhenSheet
        open={screen === 'when'}
        now={now}
        schedule={schedule}
        initial={{ date: values.date, until: values.until, ...(values.time ? { time: values.time } : {}) }}
        onClose={() => back()}
        onDone={({ date, time, until }) => back({ date, time, until })}
      />
      <CommentSheet
        open={screen === 'comment'}
        initial={values.comment}
        onType={(comment) => change({ comment })}
        onClose={() => back()}
        onDone={(comment) => back({ comment })}
      />
    </>
  );
}
