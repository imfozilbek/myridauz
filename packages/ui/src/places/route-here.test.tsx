import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testMap } from '../map/map-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { RouteScreen } from './route-screen';

const location = vi.hoisted(() => ({ knownPosition: vi.fn(async () => ({ lat: 41.3, lng: 69.2 })) }));
vi.mock('../telegram/location', () => location);
afterEach(cleanup);

describe('«Qayerdan» by the place of the person (G26, docs/74)', () => {
  it('fills the district where the person stands when they allowed the place before', async () => {
    renderMarket(
      <RouteScreen allowWholeRegion onBack={() => undefined} onDone={() => undefined} />,
      testClients({ map: testMap() }),
    );
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
  });

  it('leaves it empty when the place is not known', async () => {
    location.knownPosition.mockResolvedValueOnce(null);
    renderMarket(
      <RouteScreen allowWholeRegion onBack={() => undefined} onDone={() => undefined} />,
      testClients({ map: testMap() }),
    );
    expect(await screen.findByText('Qayerdan')).toBeTruthy();
    expect(screen.queryByText('Chilonzor')).toBeNull();
  });
});
