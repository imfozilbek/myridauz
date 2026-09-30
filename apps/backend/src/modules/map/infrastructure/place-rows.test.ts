import { describe, expect, it } from 'vitest';
import { collectPlaces, type RawPlace } from './place-rows';

const AREAS = [
  { name: 'Chilonzor', lat: 41.28, lng: 69.2 },
  { name: 'Yunusobod', lat: 41.36, lng: 69.29 },
];
const inside = (point: { lat: number; lng: number }) => point.lng < 71;
const raw = (over: Partial<RawPlace>): RawPlace => ({
  layer: 'pois',
  kind: 'marketplace',
  name: 'Chilonzor bozori',
  names: [],
  point: { lat: 41.281, lng: 69.201 },
  ...over,
});

describe('the places of the search index from the map (G23)', () => {
  it('keeps the kind, the nearest district and the words of every spelling', () => {
    const [place] = collectPlaces([raw({ names: ['Чиланзарский базар'] })], AREAS, inside);
    expect(place).toMatchObject({
      name: 'Chilonzor bozori',
      kind: 'market',
      area: 'Chilonzor',
      cell: '165x276',
    });
    expect(place?.words).toBe('chilanzar bazari chilanzarskiy bazar');
  });

  it('shows the Uzbek name when the map has one', () => {
    const [place] = collectPlaces([raw({ name: 'Чорсу', uz: 'Chorsu' })], AREAS, inside);
    expect(place?.name).toBe('Chorsu');
  });

  it('keeps one street per district and one landmark per spot', () => {
    const street = (lat: number) =>
      raw({ layer: 'roads', kind: 'minor_road', name: 'Bunyodkor', point: { lat, lng: 69.2 } });
    const places = collectPlaces(
      [
        street(41.28),
        street(41.281),
        street(41.36),
        raw({}),
        raw({}),
        raw({ point: { lat: 41.3, lng: 69.25 } }),
      ],
      AREAS,
      inside,
    );
    expect(places.filter((place) => place.kind === 'street').map((place) => place.area)).toEqual([
      'Chilonzor',
      'Yunusobod',
    ]);
    expect(places.filter((place) => place.kind === 'market')).toHaveLength(2);
  });

  it('leaves out what is not a place, has no name or lies outside Uzbekistan', () => {
    const places = collectPlaces(
      [raw({ layer: 'water', kind: 'river' }), raw({ name: ' ' }), raw({ point: { lat: 43.2, lng: 76.9 } })],
      AREAS,
      inside,
    );
    expect(places).toEqual([]);
  });
});
