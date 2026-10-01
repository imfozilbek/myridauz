import { extraKm, type Booking, type Point } from '@platform/contracts';
import type { BookingRecord } from '../domain/booking';

// The extra way of each request to the confirmed passengers of the same trip (docs/70): the
// driver sees «+N km» next to the area. Measured on the stored points: the view hides them.
const pointsOf = (records: readonly BookingRecord[], key: 'pickup' | 'dropoff'): Point[] =>
  records.flatMap((record) => (record[key] ? [record[key]] : []));

export function withExtraWay(views: readonly Booking[], records: readonly BookingRecord[]): Booking[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const measured = views.map((view) => {
    const record = byId.get(view.id);
    if (!record || view.status !== 'requested') return view;
    const taken = records.filter((other) => other.tripId === record.tripId && other.status === 'confirmed');
    const stops = { pickups: pointsOf(taken, 'pickup'), dropoffs: pointsOf(taken, 'dropoff') };
    return { ...view, extraKm: extraKm(stops, { pickup: record.pickup, dropoff: record.dropoff }) };
  });
  const waiting = measured.filter((view) => view.status === 'requested');
  const rest = measured.filter((view) => view.status !== 'requested');
  return [...waiting.sort((a, b) => (a.extraKm ?? 0) - (b.extraKm ?? 0)), ...rest];
}
