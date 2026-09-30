// "Mening safarlarim" (docs/65 B6): what is ahead first, the nearest at the top; then what is past,
// the latest first. Never mixed by the day it was created.
export function upcomingFirst<T>(items: readonly T[], when: (item: T) => number, now: number): T[] {
  const ahead = items.filter((item) => when(item) >= now).sort((a, b) => when(a) - when(b));
  const past = items.filter((item) => when(item) < now).sort((a, b) => when(b) - when(a));
  return [...ahead, ...past];
}
