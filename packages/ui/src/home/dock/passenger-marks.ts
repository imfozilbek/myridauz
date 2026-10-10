import { useSyncExternalStore } from 'react';
import type { PassengerMarks } from './passenger-state';

// What a passenger told the block on this phone (G76, docs/165): «Roziman» to a moved time and a
// trip of a saved driver seen are kept (a lost storage only asks again); «Hali yoʻldaman» lasts
// while the app is open.
const AGREED = 'moved-agreed';
const SEEN = 'favorite-trips-seen';
const KEPT = 50;

function read(key: string): readonly string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function keep(key: string, id: string) {
  try {
    localStorage.setItem(key, JSON.stringify([id, ...read(key)].slice(0, KEPT)));
  } catch {
    // No storage on this phone: the block may ask again, nothing breaks.
  }
}

const listeners = new Set<() => void>();
const stillOnWay = new Set<string>();
let marks: PassengerMarks & { readonly seen: ReadonlySet<string> } = fresh();

function fresh() {
  return { agreed: new Set(read(AGREED)), stillOnWay: new Set(stillOnWay), seen: new Set(read(SEEN)) };
}

function changed() {
  marks = fresh();
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const usePassengerMarks = () => useSyncExternalStore(subscribe, () => marks);

export const markAgreed = (bookingId: string) => (keep(AGREED, bookingId), changed());
export const markSeen = (tripId: string) => (keep(SEEN, tripId), changed());
export const markStillOnWay = (bookingId: string) => (stillOnWay.add(bookingId), changed());
