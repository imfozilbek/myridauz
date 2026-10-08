import { HOUR_MS } from './tashkent-time';
import { DRIVER_TRIPS_PATH } from './trips';

// «Yoʻlga chiqdim» works from an hour before the time of the trip (G63, docs/35).
export const DEPART_EARLY_MS = HOUR_MS;
// No «Yoʻlga chiqdim» an hour after the time: the driver bot asks once; two hours after, the Cron
// puts the trip on the road by itself (owner decision 06.10.2026).
export const DEPART_REMIND_MS = HOUR_MS;
export const DEPART_AUTO_MS = 2 * HOUR_MS;

export const tripDepartPath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/depart`;
export const tripArrivePath = (id: string) => `${DRIVER_TRIPS_PATH}/${id}/arrive`;

type Departure = { readonly departAt: number; readonly departedAt: number | null };

// On the road: the driver pressed «Yoʻlga chiqdim», or the time of the trip came. Every rule of
// «the trip left» reads this, so an early departure counts everywhere (docs/35).
export const onTheWay = (trip: Departure, now: number) => trip.departedAt !== null || now >= trip.departAt;
