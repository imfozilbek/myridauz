import {
  VIA_DRIVER,
  VIA_SITE,
  VIA_STORY,
  type ArrivalKind,
  type Arrivals,
  type Platform,
} from '@platform/contracts';

// One group of new people: the mark of their source and their platform, as kept at the registration.
export type ArrivalCount = {
  readonly via: string | null;
  readonly client: string | null;
  readonly count: number;
};

// «ch-rida-samarqand»: the mark of a person who came from a channel (G55).
export const CHANNEL_MARK = 'ch-';
const MARKED: readonly [string, ArrivalKind][] = [
  [CHANNEL_MARK, 'channel'],
  ['ad-', 'ad'],
];
const PLAIN: Readonly<Record<string, ArrivalKind>> = {
  [VIA_STORY]: 'story',
  [VIA_SITE]: 'site',
  [VIA_DRIVER]: 'driver',
};

// «ch-rida-samarqand» is a channel named rida-samarqand; no mark is a direct visit (G55, docs/116).
function sourceOf(via: string | null): { kind: ArrivalKind; mark: string } {
  if (via === null) return { kind: 'direct', mark: '' };
  const marked = MARKED.find(([prefix]) => via.startsWith(prefix));
  if (marked) return { kind: marked[1], mark: via.slice(marked[0].length) };
  return { kind: PLAIN[via] ?? 'other', mark: PLAIN[via] ? '' : via };
}

// The Telegram app says the platform: Android, iPhone or iPad, or a computer.
const DESKTOP = new Set(['tdesktop', 'macos', 'web', 'weba', 'webk', 'unigram']);
function platformOf(client: string | null): Platform {
  const app = client?.split(' ')[0] ?? '';
  if (app === 'android' || app === 'android_x') return 'android';
  if (app === 'ios') return 'ios';
  return DESKTOP.has(app) ? 'desktop' : 'other';
}

function summed<T>(entries: readonly [string, T, number][]): [T, number][] {
  const sums = new Map<string, [T, number]>();
  for (const [key, value, count] of entries) sums.set(key, [value, (sums.get(key)?.[1] ?? 0) + count]);
  return [...sums.values()].sort((a, b) => b[1] - a[1]);
}

// The sources and the platforms of the new people, the biggest first.
export function arrivalsOf(groups: readonly ArrivalCount[]): Arrivals {
  const sources = summed(
    groups.map(({ via, count }) => {
      const source = sourceOf(via);
      return [`${source.kind} ${source.mark}`, source, count] as [string, typeof source, number];
    }),
  ).map(([source, count]) => ({ ...source, count }));
  const platforms = summed(
    groups.map(({ client, count }) => {
      const platform = platformOf(client);
      return [platform, platform, count] as [string, Platform, number];
    }),
  ).map(([platform, count]) => ({ platform, count }));
  return { sources, platforms };
}
