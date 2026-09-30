import { describe, expect, it } from 'vitest';
import { MAP_SOURCE, mapStyle } from './map-style';

describe('the style of the map (G22)', () => {
  const style = mapStyle({
    archiveUrl: 'https://api.test/map/uzbekistan.pmtiles',
    fontsUrl: 'https://api.test/map/fonts/{fontstack}/{range}.pbf',
  });

  it('reads our own archive and fonts, nothing from other hosts', () => {
    expect(style.sources[MAP_SOURCE]).toEqual({
      type: 'vector',
      url: 'pmtiles://https://api.test/map/uzbekistan.pmtiles',
    });
    expect(style.glyphs).toBe('https://api.test/map/fonts/{fontstack}/{range}.pbf');
    expect(style.sprite).toBeUndefined();
  });

  it('keeps the names of places and drops the icons we do not serve', () => {
    const symbols = style.layers.filter((layer) => layer.type === 'symbol');
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols.every((layer) => !('icon-image' in (layer.layout ?? {})))).toBe(true);
    expect(symbols.some((layer) => 'text-field' in (layer.layout ?? {}))).toBe(true);
  });
});
