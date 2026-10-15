import { describe, expect, it } from 'vitest';
import { VIA_PATTERN } from '../arrival';
import { GROWTH_LOOPS, loopOf, loopVia, momentCount, momentLoop, SHARE_MOMENTS } from './loops';

describe('the marks of the loops of growth (G69, docs/123, docs/116)', () => {
  it('carries the loop and the short code of the author, within 21 signs', () => {
    for (const loop of GROWTH_LOOPS) {
      const via = loopVia(loop, 'a1b2c3');
      expect(via).toMatch(VIA_PATTERN);
      expect(loopOf(via)).toEqual({ loop, code: 'a1b2c3' });
    }
  });

  it('knows no author in the marks of channels, ads and the site', () => {
    for (const via of ['ch-samarqand', 'ad-insta1', 'site', 'story', 'qr-abc', 'share-join-ABC123'])
      expect(loopOf(via)).toBeNull();
  });

  it('gives each moment the loop of its card', () => {
    expect(SHARE_MOMENTS.map(momentLoop)).toEqual([
      'share-join',
      'share-trip',
      'share-trip',
      'share-trip',
      'share-trip',
      'share-driver',
      'share-riders',
      'share-riders',
      'share-riders',
    ]);
  });

  it('reads the round count of a moment', () => {
    expect(SHARE_MOMENTS.map(momentCount)).toEqual([0, 1, 5, 10, 25, 0, 10, 50, 100]);
  });
});
