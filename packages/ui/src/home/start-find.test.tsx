import type { Location } from '@platform/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDirectory } from '../places/directory';
import { startFind } from './dock-ends';

const place = (id: string, parentId: string | null, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name: id,
  lat: 41,
  lng: 69,
  oneCity,
});
const TOSHKENT = place('1726', null, true);
const CHILONZOR = place('1726269', '1726');
const YUNUSOBOD = place('1726266', '1726');
const FARGONA = place('1730401', '1730');
const directory = buildDirectory([TOSHKENT, place('1730', null), CHILONZOR, YUNUSOBOD, FARGONA]);

afterEach(() => localStorage.clear());

// Prod 18.11.2026: «Qayerdan va qayerga bir xil boʻlmasin» twice on home at trips/days, «Safar topish»
// of the block opened a search with one place at both ends (G96).
describe('startFind: «Safar topish» of the block', () => {
  it('opens the trips of a route a trip may take', () => {
    expect(startFind({ from: CHILONZOR, to: FARGONA }, directory)).toEqual({
      route: { from: CHILONZOR, to: FARGONA },
    });
  });

  it('asks «Qayerga» again for one place at both ends, and for two places of one city', () => {
    expect(startFind({ from: CHILONZOR, to: CHILONZOR }, directory)).toEqual({ from: CHILONZOR });
    expect(startFind({ from: CHILONZOR, to: YUNUSOBOD }, directory)).toEqual({ from: CHILONZOR });
    expect(localStorage.getItem('route_recent')).toBeNull();
  });
});
