import type { Point } from '@platform/contracts';

// A point in a query: «lat,lng». Rounded to these digits: near points share one cache entry.
const POINT = /^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/u;

export function parsePoint(value: string | undefined, digits: number): Point | null {
  const match = POINT.exec(value ?? '');
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Number(lat.toFixed(digits)), lng: Number(lng.toFixed(digits)) };
}
