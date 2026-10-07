import { describe, expect, it } from 'vitest';
import { MAP_SOURCE, mapStyle } from './map-style';

describe('the style of the map (G22)', () => {
  const colors = { shade: 'shade', line: 'line', water: 'water-tint', park: 'park-tint', road: 'road-tint' };
  const style = mapStyle(
    {
      archiveUrl: 'https://api.test/map/uzbekistan.pmtiles',
      fontsUrl: 'https://api.test/map/fonts/{fontstack}/{range}.pbf',
    },
    colors,
  );
  const paint = (id: string) => JSON.stringify(style.layers.find((layer) => layer.id === id)?.paint);

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

  it('paints the water, the parks and the highways in the colors of the brand (docs/126)', () => {
    expect(paint('water')).toContain(colors.water);
    expect(paint('roads_highway')).toContain(colors.road);
  });
});
