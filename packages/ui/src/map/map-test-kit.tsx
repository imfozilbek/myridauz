import type { MapClient } from '@platform/api-client';
import type { FoundPlace, Point, Where } from '@platform/contracts';
import { vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import type { Way } from '../way/way-end';
import { WayScreen } from '../way/way-screen';
import { fakeMap } from './fake-map';
import { MapEngineContext } from './map-engine';

export { fakeMap } from './fake-map';

export const CHORSU: FoundPlace = {
  name: 'Chorsu bozori',
  kind: 'market',
  area: 'Chilonzor',
  district: '1726269',
  point: { lat: 41.3265, lng: 69.2355 },
};
// Anything south of 41 is Fargʻona shahri, the rest Chilonzor (the small directory of the tests).
const whereOf = async (point: Point): Promise<Where> =>
  point.lat < 41
    ? { district: '1730401', name: { step: 'mahalla', name: 'Yangi Margʻilon' }, area: null }
    : { district: '1726269', name: { step: 'landmark', name: 'Chorsu bozori' }, area: null };
export const FARGONA = { lat: 40.38, lng: 71.78 };
const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 } };

type Calls = Partial<Pick<MapClient, 'search' | 'where' | 'pitakOf'>>;

// The screen «Qayerdan / Qayerga» over a fake map (G24): what it gave back when done.
export function openWay(map: ReturnType<typeof fakeMap>, calls: Calls = {}) {
  const done: Way[] = [];
  const mapCalls: Partial<MapClient> = {
    where: vi.fn(whereOf),
    border: async (id) => ({
      id,
      parts: [
        [
          [
            [69, 41],
            [70, 41],
            [70, 42],
            [69, 41],
          ],
        ],
      ],
    }),
    pitakOf: vi.fn(async () => PITAK),
    search: vi.fn(async () => [CHORSU]),
    ...calls,
  };
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <WayScreen done="way.see" onBack={() => undefined} onDone={(way) => void done.push(way)} />
    </MapEngineContext.Provider>,
    testClients({ map: mapCalls }),
  );
  return { done, calls: mapCalls };
}
