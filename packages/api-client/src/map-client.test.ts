import { MAP_ARCHIVE } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { createMapClient } from './map-client';

const options = { baseUrl: 'https://api.example.uz/', fetch, app: 'passenger', initData: 'x' } as const;

// The map comes from the public bucket of the brand when the deploy gives its address (G57, docs/67).
describe('the address of the map', () => {
  it('reads the archive and the fonts from the public bucket in production', () => {
    const map = createMapClient({ ...options, mapUrl: 'https://map.example.uz/' });
    expect(map.archiveUrl).toBe(`https://map.example.uz/map/${MAP_ARCHIVE}`);
    expect(map.fontsUrl).toBe('https://map.example.uz/map/fonts/{fontstack}/{range}.pbf');
  });

  it('reads them through the API locally and on the stand', () => {
    expect(createMapClient(options).archiveUrl).toBe(`https://api.example.uz/map/${MAP_ARCHIVE}`);
  });
});
