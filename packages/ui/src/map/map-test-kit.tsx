import type { MapClient } from '@platform/api-client';
import type { FoundPlace, Point, Where } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { vi } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { useDirectory } from '../places/use-directory';
import { PointScreen } from '../way/point-screen';
import type { WayEnd } from '../way/way-end';
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
const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 }, hint: null };

type Calls = Partial<Pick<MapClient, 'search' | 'where' | 'pitakOf' | 'border' | 'near'>>;

// The map calls of the tests: the district by the point, a square border, the pitak, a search.
export const testMap = (calls: Calls = {}): Partial<MapClient> => ({
  where: vi.fn(whereOf),
  // A border around every test place: the map of a zone stays where it opened.
  border: async (id) => ({
    id,
    parts: [
      [
        [
          [60, 35],
          [80, 35],
          [80, 45],
          [60, 45],
          [60, 35],
        ],
      ],
    ],
  }),
  pitakOf: vi.fn(async () => PITAK),
  search: vi.fn(async () => [CHORSU]),
  ...calls,
});

export const HERE = { lat: 41.2856, lng: 69.2045 };
const TITLE: TranslationKey = 'way.point.from';

// One point over a fake map (G24): no zone, like the pitak of the team; with «findMe» like a pickup.
function TestPoint({ findMe, onPick }: { readonly findMe: boolean; readonly onPick: (end: WayEnd) => void }) {
  const [state] = useDirectory();
  if (state.status !== 'ready') return null;
  const { find } = state.directory;
  return (
    <PointScreen
      title={TITLE}
      start={HERE}
      find={find}
      findMe={findMe}
      onBack={() => undefined}
      onPick={onPick}
    />
  );
}

// What the point gave back when taken, and the map calls.
export function openPoint(map: ReturnType<typeof fakeMap>, calls: Calls = {}, findMe = false) {
  const done: WayEnd[] = [];
  const mapCalls = testMap(calls);
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <TestPoint findMe={findMe} onPick={(end) => void done.push(end)} />
    </MapEngineContext.Provider>,
    testClients({ map: mapCalls }),
  );
  return { done, calls: mapCalls };
}
