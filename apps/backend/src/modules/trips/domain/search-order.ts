import type { Trip } from '@platform/contracts';

const HOUR_MS = 60 * 60 * 1000;
// A new driver without ratings stands as a good one, above low ratings: a fair start, never
// always last in the hour (G41, docs/90 F-P14).
const NEW_DRIVER_RATING = 4;
const ratingOf = (trip: Trip) => trip.driver.rating.average ?? NEW_DRIVER_RATING;

// The search: by the hour of departure; within the same hour a higher rating goes first (docs/24).
export const byHourThenRating = (a: Trip, b: Trip) =>
  Math.floor(a.departAt / HOUR_MS) - Math.floor(b.departAt / HOUR_MS) ||
  ratingOf(b) - ratingOf(a) ||
  a.departAt - b.departAt;
