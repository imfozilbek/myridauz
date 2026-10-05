import { describe, expect, it } from 'vitest';
import { mapBucket, mapCors, oldArchives, withStoriesRule } from './deploy/r2-rules.mjs';

const ABORT = { id: 'Default Multipart Abort Rule', enabled: true, conditions: {} };

describe('the rules of the R2 buckets (G57)', () => {
  it('deletes the story pictures after a day and keeps the other rules', () => {
    const rules = withStoriesRule([ABORT]);
    expect(rules[0]).toEqual(ABORT);
    expect(rules[1]).toMatchObject({
      conditions: { prefix: 'stories/' },
      deleteObjectsTransition: { condition: { type: 'Age', maxAge: 86_400 } },
    });
    expect(withStoriesRule(rules)).toEqual(rules);
  });

  it('lets only the Mini Apps read the map by parts, from its own bucket', () => {
    const cors = mapCors(['https://passenger.example.uz']);
    expect(cors.rules[0]?.allowed).toEqual({
      origins: ['https://passenger.example.uz'],
      methods: ['GET', 'HEAD'],
      headers: ['range'],
    });
    expect(cors.rules[0]?.exposeHeaders).toContain('content-range');
    expect(mapBucket({ id: 'yol' })).toBe('yol-map');
  });

  it('finds the archives of older builds, never the current one or the fonts', () => {
    const stored = ['map/uzbekistan-1.pmtiles', 'map/uzbekistan-2.pmtiles', 'map/fonts/Noto/0-255.pbf'];
    expect(oldArchives(stored, 'uzbekistan-2.pmtiles')).toEqual(['map/uzbekistan-1.pmtiles']);
  });
});
