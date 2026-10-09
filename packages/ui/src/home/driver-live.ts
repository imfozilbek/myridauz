import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { usePending } from '../driver/driver-context';
import type { TileLive } from '../flow/start-action';
import { useLoad } from '../market/use-list';
import { useDriverData } from './driver-data';
import { nextTrip, weekTrips } from './driver-day';
import { waitingRequests } from './home-items';

// «Yoʻlovchilar soʻrovlari»: how many requests wait on the directions of the driver (G66, mockup
// g66/2), from the board of requests itself. Before the approval the server keeps it closed.
export function useRequestsNearLive(): TileLive {
  const { t } = useI18n();
  const { market } = useApiClients();
  const { value } = useLoad(() => market.requestBoard({}), 'home.board');
  if (!value?.known) return {};
  const count = value.days.reduce((sum, day) => sum + day.count, 0);
  return count > 0 ? { badge: count, hint: t('home.driver.near', { count: String(count) }) } : {};
}

// «Mening safarlarim»: the trips of the week; the new requests of the trips under the card on top
// (G53, G66). Until the approval it says when it opens.
export function useDriverTripsLive(): TileLive {
  const { t } = useI18n();
  const pending = usePending();
  const { value } = useDriverData();
  const [now] = useState(Date.now);
  if (pending) return { hint: t('drivers.status.pending.after') };
  if (!value) return {};
  const [trips, requests] = value;
  const shown = nextTrip(trips, now);
  const week = weekTrips(trips, now);
  const badge = trips
    .filter((trip) => trip !== shown && trip.status !== 'cancelled' && trip.departAt > now)
    .reduce((sum, trip) => sum + waitingRequests(trip, requests), 0);
  return { badge, ...(week > 0 ? { hint: t('home.driver.week', { count: String(week) }) } : {}) };
}
