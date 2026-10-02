// "Mening safarlarim" (docs/65 B6): what is ahead first, the nearest at the top; then what is past,
// the latest first. Never mixed by the day it was created. A trip on the road stays ahead until
// `until` (its arrival), so it is on top while it goes (docs/90 F-D3).
export function upcomingFirst<T>(
  items: readonly T[],
  when: (item: T) => number,
  now: number,
  until: (item: T) => number = when,
): T[] {
  const ahead = items.filter((item) => until(item) >= now).sort((a, b) => when(a) - when(b));
  const past = items.filter((item) => until(item) < now).sort((a, b) => when(b) - when(a));
  return [...ahead, ...past];
}
