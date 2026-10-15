import { PLATFORMS, type Platform, type WaitlistStats } from '@platform/contracts';
import { directionsOf, reachBy, shortageOf } from '../domain/gold';
import { sourceOf } from '../domain/sources';
import type { TeamReads } from './ports';

const isPlatform = (key: string | null): key is Platform =>
  (PLATFORMS as readonly (string | null)[]).includes(key);

// The «gold» of «Statistika» (docs/183): what the list says besides its funnels. since: the start of
// the period; the shortage and «Qanchalik tez-tez» are the list as it is now.
export async function waitlistStats(reads: TeamReads, since: number): Promise<WaitlistStats> {
  const [sources, devices, after, hours, regions, cadences, bothRoles] = await Promise.all([
    reads.sources(since),
    reads.devices(since),
    reads.after(since),
    reads.hours(since),
    reads.regions(),
    reads.cadences(),
    reads.bothRoles(),
  ]);
  return {
    after,
    sources: reachBy(sources, sourceOf).map(({ key, ...reach }) => ({ source: key, ...reach })),
    devices: reachBy(devices, (key) => (isPlatform(key) ? key : 'other')).map(({ key, ...reach }) => ({
      platform: key,
      ...reach,
    })),
    hours: hours.sort((a, b) => a.from - b.from),
    shortage: shortageOf(directionsOf(regions)),
    cadences,
    bothRoles,
  };
}
