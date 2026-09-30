import type { Point } from './point';

// «Yoʻl koʻrsatish» (G24, docs/70): one route through every stop in the driver's order, in the
// navigator the driver chose once. The start is where the driver stands: the navigator knows it.
export const NAVIGATORS = ['yandex', 'google', 'apple'] as const;
export type Navigator = (typeof NAVIGATORS)[number];
// Google opens at most this many stops from a link on a phone.
const GOOGLE_STOPS = 10;

const at = ({ lat, lng }: Point) => `${lat},${lng}`;

export function navigatorUrl(navigator: Navigator, stops: readonly Point[]): string | null {
  const last = stops.at(-1);
  if (!last) return null;
  if (navigator === 'yandex') return `https://yandex.uz/maps/?rtext=~${stops.map(at).join('~')}&rtt=auto`;
  if (navigator === 'apple') {
    // Apple Maps opens one stop reliably: the first one in the order.
    const [first = last] = stops;
    return `https://maps.apple.com/?daddr=${at(first)}&dirflg=d`;
  }
  const google = stops.slice(0, GOOGLE_STOPS);
  const destination = google.at(-1) ?? last;
  const waypoints = google.slice(0, -1).map(at).join('|');
  const query = new URLSearchParams({ api: '1', destination: at(destination), travelmode: 'driving' });
  if (waypoints) query.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}
