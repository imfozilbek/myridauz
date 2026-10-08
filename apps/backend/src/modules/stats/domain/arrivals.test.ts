import { describe, expect, it } from 'vitest';
import { arrivalsOf } from './arrivals';

describe('where the new people came from (G55, docs/116)', () => {
  it('sums the people by the source of their mark, the biggest first', () => {
    const arrivals = arrivalsOf([
      { via: 'ch-yol-samarqand', client: 'android 9.6 chrome 120', count: 3 },
      { via: 'ch-yol-samarqand', client: 'ios 9.6 safari 17', count: 2 },
      { via: 'ad-insta1', client: 'android 9.6 chrome 83', count: 1 },
      { via: null, client: 'tdesktop 9.6', count: 4 },
      { via: 'story', client: null, count: 1 },
      { via: 'site', client: 'weba 9.5', count: 1 },
      { via: 'friend1', client: 'something', count: 1 },
      { via: 'driver', client: 'android 9.6 chrome 120', count: 2 },
    ]);
    expect(arrivals.sources).toEqual([
      { kind: 'channel', mark: 'yol-samarqand', count: 5 },
      { kind: 'direct', mark: '', count: 4 },
      { kind: 'driver', mark: '', count: 2 },
      { kind: 'ad', mark: 'insta1', count: 1 },
      { kind: 'story', mark: '', count: 1 },
      { kind: 'site', mark: '', count: 1 },
      { kind: 'other', mark: 'friend1', count: 1 },
    ]);
    expect(arrivals.platforms).toEqual([
      { platform: 'android', count: 6 },
      { platform: 'desktop', count: 5 },
      { platform: 'ios', count: 2 },
      { platform: 'other', count: 2 },
    ]);
  });

  it('is empty without new people', () => {
    expect(arrivalsOf([])).toEqual({ sources: [], platforms: [] });
  });
});
