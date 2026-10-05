import { useLayoutEffect, useRef } from 'react';

// What a list had when the person opened one of its rows (docs/94 F2): its data, its page of
// «Yana koʻrsatish» and its place. «Назад» shows the same list at the same place, without a skeleton.
const kept = new Map<string, unknown>();
const places = new Map<string, number>();

export const keptValue = <T>(key: string): T | undefined => kept.get(key) as T | undefined;
export const keepValue = (key: string, value: unknown) => void kept.set(key, value);

// The list goes back to its place once its rows are on the screen again; leaving, it writes it down.
export function useListPlace(key: string, ready: boolean) {
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const place = places.get(key);
    if (place) window.scrollTo(0, place);
  }, [key, ready]);
  useLayoutEffect(() => {
    return () => {
      places.set(key, window.scrollY);
    };
  }, [key]);
}

// Tests start each one with an empty memory: the data of one test never opens the next one.
export function forgetAllLists() {
  kept.clear();
  places.clear();
}

// The person leaves the list itself: the next visit opens it fresh, at the top.
export function forgetList(key: string) {
  places.delete(key);
  for (const name of kept.keys()) if (name.startsWith(key)) kept.delete(name);
}
