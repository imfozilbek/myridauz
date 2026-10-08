import type { MapClient, MarketClient } from '@platform/api-client';
import type { RideRequest, RideRequestInput } from '@platform/contracts';
import { vi } from 'vitest';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { recommendation, renderMarket } from './market-test-kit';
import { NewRequestFlow } from './new-request-flow';

type Options = {
  readonly onBack?: () => void;
  // The own requests and offers, for a request already left on the same day (G37).
  readonly mine?: Partial<Pick<MarketClient, 'myRequests'>>;
  readonly search?: Parameters<typeof NewRequestFlow>[0]['search'];
  readonly map?: Partial<Pick<MapClient, 'pitakOf'>>;
  // «Men bilan ayol bor» is a man's (docs/06 rule 4).
  readonly gender?: 'male' | 'female';
};

// A request over a fake map (G35, docs/97): what it published.
export function openRequest({
  onBack = () => undefined,
  search,
  map = {},
  mine = {},
  gender = 'male',
}: Options = {}) {
  // A sent request is in «Mening soʻrovim» right after (G61).
  const sent: RideRequest[] = [];
  const publishRequest = vi.fn(async (input: RideRequestInput) => {
    const made: RideRequest = {
      ...input,
      pickupMode: input.pickupMode,
      wholeCar: input.wholeCar ?? false,
      withWoman: input.withWoman ?? false,
      callsOff: false,
      id: 'r1',
      passenger: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: false },
      km: 320,
      status: 'open',
    };
    sent.push(made);
    return made;
  });
  const engine = fakeMap().engine;
  renderMarket(
    <MapEngineContext.Provider value={async () => engine}>
      <NewRequestFlow onBack={onBack} {...(search ? { search } : {})} />
    </MapEngineContext.Provider>,
    testClients({
      market: {
        recommend: async () => recommendation,
        publishRequest,
        myRequests: async () => sent,
        ...mine,
      },
      bookings: { myOffers: async () => [] },
      map: testMap(map),
    }),
    gender,
  );
  return publishRequest;
}
