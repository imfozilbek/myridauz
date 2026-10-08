import { formatPlate, type Car, type Pitak, type Recommendation, type Trip } from '@platform/contracts';
import { useState } from 'react';
import { PointsScreen } from '../bookings/points-screen';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { carLabel } from '../driver/car-choices';
import { usePending } from '../driver/driver-context';
import { usePlaceNames } from '../places/place-names';
import type { Route } from '../places/route-screen';
import { haptic } from '../telegram/feedback';
import { errorKey } from './error-text';
import type { TripAnswer } from './new-trip-state';
import { usePlaces } from './places-gate';
import { TripChoice, type TripPart } from './trip-choice';
import { publishInput, type TripValues } from './trip-draft';

type Props = {
  readonly route: Route;
  readonly values: TripValues;
  readonly car: Car | null;
  readonly carSeats: number;
  readonly recommendation: Recommendation;
  readonly pitak: Pitak | null;
  // The short name of the region the trip goes to: «Samarqand yoʻnalishi pitagi» (mockup g63/2).
  readonly direction: string;
  readonly now: number;
  readonly onChange: (patch: TripAnswer) => void;
  readonly onOpen: (part: TripPart | 'from' | 'to') => void;
  readonly onBack: () => void;
  readonly onPublished: (trip: Trip) => void;
};

// «Safar eʼlon qilish» (G63, docs/118 path 6, mockups g63/1, g63/2): the screen of a booking and of
// a request with the trip of the driver in it: the car, the route, «Safar», «Eʼlon qilish». A driver
// whose application is checked tries everything but publishing (docs/86 V7).
export function TripForm(props: Props) {
  const { route, values, car, onOpen, onPublished } = props;
  useScreenView('market.publish');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { market } = useApiClients();
  const names = usePlaceNames(usePlaces());
  const pending = usePending();
  const [error, setError] = useState<ReturnType<typeof errorKey> | null>(null);
  const publish = async () => {
    const input = publishInput(values);
    // The day has no free time left: the day and the time are chosen again (docs/103).
    if (!input) return onOpen('when');
    setError(null);
    try {
      const trip = await market.publishTrip(input);
      track({ name: 'trip_step', screen: 'market.publish', step: 'published' });
      haptic.success();
      return onPublished(trip);
    } catch (caught) {
      haptic.error();
      return setError(errorKey(caught));
    }
  };
  const color = car ? t(`drivers.color.${car.color}`) : '';
  return (
    <PointsScreen
      look="trip"
      title={t('home.publish')}
      sub={car ? t('market.publish.car', { model: carLabel(car), color, plate: formatPlate(car.plate) }) : ''}
      labels={{ pickup: t('places.from'), dropoff: t('places.to') }}
      start={names.end(route.from)}
      end={names.end(route.to)}
      onEnd={(end) => onOpen(end === 'pickup' ? 'from' : 'to')}
      head={t('market.publish.head')}
      {...(pending ? { hint: t('drivers.status.pending.publish') } : {})}
      error={error ? t(error) : null}
      button={pending ? null : t('market.publish.send')}
      onSend={() => void publish()}
      onBack={props.onBack}
    >
      <TripChoice
        values={values}
        carSeats={props.carSeats}
        recommendation={props.recommendation}
        pitak={props.pitak}
        direction={props.direction}
        now={props.now}
        onChange={props.onChange}
        onOpen={onOpen}
      />
    </PointsScreen>
  );
}
