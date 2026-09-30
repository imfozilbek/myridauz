import type { HeroRoads, MapData } from './map-data';

// A small map for tests: Toshkent and Samarqand (docs/59).
export const MAP: MapData = {
  width: 100,
  height: 60,
  regions: [
    { iso: 'UZ-TK', soato: '1726', d: 'M70 30L72 30L72 32Z' },
    { iso: 'UZ-SA', soato: '1718', d: 'M60 40L66 40L66 46Z' },
  ],
  cities: [
    { id: 'toshkent', name: 'Toshkent', soato: '1726', place: '1726273', x: 71, y: 31 },
    { id: 'samarqand', name: 'Samarqand', soato: '1718', place: '1718401', x: 63, y: 44 },
  ],
};

// Two roads of the first screen picture.
export const ROADS: HeroRoads = {
  box: { x: 20, y: 540, width: 1040, height: 740 },
  hub: [809, 921],
  routes: ['M809 921Q700 900 600 1000', 'M809 921Q900 910 980 960'],
};
