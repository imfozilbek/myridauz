import { DAY_MS, type Booking, type Location } from '@platform/contracts';
import { useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { HomeTile } from '../flow/home-tile';
import type { HomeGo } from '../flow/start-action';
import { recentRoutes } from '../market/recent-routes';
import type { PlaceDirectory } from '../places/directory';
import { usePlaceNames } from '../places/place-names';
import { useDirectory } from '../places/use-directory';
import { nextBookings } from './home-items';
import { usePassengerData } from './passenger-data';
import { useHomeTap } from './use-home-tap';

type Props = { readonly go: HomeGo; readonly openProfile: () => void };
type Route = { readonly from: Location; readonly to: Location };

// «Qaytish» stays a week after the trip, as long as its contacts do (docs/129).
const BACK_DAYS = 7;

// The tiles of a passenger after the actions (G53, G66): the last route of the search, one tap to its
// trips (G35 K5); with a seat booked or a trip just made, «Qaytish», the way back (docs/118); the
// profile. Without a known route the profile takes the whole row.
export function PassengerTiles({ go, openProfile }: Props) {
  const { t } = useI18n();
  const tap = useHomeTap();
  const [places] = useDirectory();
  const directory = places.status === 'ready' ? places.directory : null;
  const names = usePlaceNames(directory);
  const back = useWayBack(directory);
  const last = useLastRoute(directory);
  const line = (route: Route) => t('common.route', { from: names.toward(route.from), to: names.toward(route.to) });
  return (
    <>
      {back ? (
        <HomeTile
          icon="comeBack"
          tone="brand"
          title={t('home.comeBack')}
          hint={line(back)}
          onClick={tap('come_back', () => go('find_trip', { route: back }))}
        />
      ) : null}
      {!back && last ? (
        <HomeTile
          icon="history"
          tone="brand"
          title={t('home.driver.last')}
          hint={line(last)}
          onClick={tap('last_route', () => go('find_trip', { route: last }))}
        />
      ) : null}
      <HomeTile
        icon="profile"
        tone="deep"
        title={t('account.profile.title')}
        hint={t('home.profileHint')}
        onClick={openProfile}
      />
    </>
  );
}

function useLastRoute(directory: PlaceDirectory | null): Route | undefined {
  const [kept] = useState(recentRoutes);
  return kept.flatMap((ids) => {
    const from = directory?.find(ids.from);
    const to = directory?.find(ids.to);
    return from && to ? [{ from, to }] : [];
  })[0];
}

// The way back of the seat booked now, else of the trip made in the last week.
function useWayBack(directory: PlaceDirectory | null): Route | undefined {
  const { value } = usePassengerData();
  const [now] = useState(Date.now);
  if (!value || !directory) return undefined;
  const recent = (booking: Booking) =>
    booking.status === 'completed' && now - booking.trip.departAt < BACK_DAYS * DAY_MS;
  const done = value[0].filter(recent).sort((a, b) => b.trip.departAt - a.trip.departAt);
  const trip = (nextBookings(value[0])[0] ?? done[0])?.trip;
  const from = trip && directory.find(trip.to);
  const to = trip && directory.find(trip.from);
  return from && to ? { from, to } : undefined;
}
