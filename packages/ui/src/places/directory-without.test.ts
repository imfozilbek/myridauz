import type { Location } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { buildDirectory, without } from './directory';

const place = (id: string, parentId: string | null, name: string): Location => ({
  id,
  parentId,
  type: parentId === null ? 'region' : 'district',
  name,
  lat: 40,
  lng: 71,
});
const directory = buildDirectory([
  place('1730', null, 'Fargʻona viloyati'),
  place('1730401', '1730', 'Fargʻona shahri'),
  place('1730212', '1730', 'Oltiariq'),
]);

// «Qayerdan va qayerga bir xil boʻlmasin» 3 times on 14.11.2026: the district of «Qayerdan» was
// offered again when the results narrowed «Qayerga» to a district (G96).
describe('without: the other end of the route is not offered', () => {
  it('drops the place from the districts of its region and from the search', () => {
    const list = without(directory, '1730212');
    expect(list.inside('1730').map((p) => p.id)).toEqual(['1730401']);
    expect(list.search('Oltiariq')).toEqual([]);
    expect(list.find('1730212')?.name).toBe('Oltiariq');
  });
});
