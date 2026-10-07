import type { BookingMode, Trip } from '@platform/contracts';
import { asRecord, useFlowDraft } from '../flow/flow-draft';
import type { RememberedWay } from '../way/remembered-way';
import type { WayEnd } from '../way/way-end';

// The screens of a booking (G59, docs/118 path 2, B): «Qayerdan, qayerga?» and its two maps.
const SCREENS = ['points', 'pickup', 'dropoff'] as const;
type BookScreen = (typeof SCREENS)[number];
type Saved = {
  readonly screen: BookScreen;
  readonly mode: BookingMode | null;
  readonly pickup: WayEnd | null;
  readonly dropoff: WayEnd | null;
};

const isPoint = (end: unknown) => end === null || typeof asRecord(asRecord(end)?.['place'])?.['id'] === 'string';
// The pitak of the trip is the first start when the driver takes people there (mockup 3-pickup).
const pitakFirst = (trip: Trip) => trip.pitak !== null && trip.pickupMode !== 'door';

// A booking kept as a draft of its trip (docs/94 F3, F8): the start and the end come back on «Назад»
// and in a reopened app. The way of the last trip on this route fills both at once (G35, docs/97 K4).
export function useBooking(trip: Trip, last: RememberedWay | null) {
  const allows = (mode: unknown) =>
    mode === null || (mode === 'pitak' ? pitakFirst(trip) : mode === 'door' && trip.pickupMode !== 'pitak');
  const check = (value: unknown): Saved | null => {
    const saved = asRecord(value);
    if (!saved || !SCREENS.some((screen) => screen === saved['screen'])) return null;
    const fits = allows(saved['mode']) && isPoint(saved['pickup']) && isPoint(saved['dropoff']);
    return fits ? (saved as Saved) : null;
  };
  const kept = last && last.mode !== 'both' && allows(last.mode) ? last : null;
  const start: Saved = kept
    ? { screen: 'points', mode: kept.mode as BookingMode, pickup: kept.pickup, dropoff: kept.dropoff }
    : { screen: 'points', mode: pitakFirst(trip) ? 'pitak' : null, pickup: null, dropoff: null };
  const { value, setValue, restored, clear } = useFlowDraft(`booking:${trip.id}`, check, start);
  const patch = (change: Partial<Saved>) => setValue((saved) => ({ ...saved, ...change }));
  // Both ends chosen: the request can go (mockup 3-pickup: «Soʻrov yuborish» only with both).
  const ready = value.mode !== null && (value.mode === 'pitak' || value.pickup !== null) && value.dropoff !== null;
  return { ...value, ready, restored, clear, patch, pitakFirst: pitakFirst(trip) };
}
