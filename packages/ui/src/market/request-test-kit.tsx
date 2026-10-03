import type { MapClient } from '@platform/api-client';
import type { RideRequestInput } from '@platform/contracts';
import { vi } from 'vitest';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { recommendation, renderMarket } from './market-test-kit';
import { NewRequestFlow } from './new-request-flow';

type Options = {
  readonly onBack?: () => void;
  readonly search?: Parameters<typeof NewRequestFlow>[0]['search'];
  readonly map?: Partial<Pick<MapClient, 'pitakOf'>>;
};

// A request over a fake map (G35, docs/97): what it published.
export function openRequest({ onBack = () => undefined, search, map = {} }: Options = {}) {
  const publishRequest = vi.fn(async (input: RideRequestInput) => ({
    ...input,
    id: 'r1',
    passenger: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: false },
    km: 320,
    status: 'open' as const,
  }));
  const engine = fakeMap().engine;
  renderMarket(
    <MapEngineContext.Provider value={async () => engine}>
      <NewRequestFlow onBack={onBack} {...(search ? { search } : {})} />
    </MapEngineContext.Provider>,
    testClients({ market: { recommend: async () => recommendation, publishRequest }, map: testMap(map) }),
  );
  return publishRequest;
}
