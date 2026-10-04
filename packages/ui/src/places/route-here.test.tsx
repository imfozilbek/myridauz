import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testMap } from '../map/map-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { RouteScreen } from './route-screen';

const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

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

  it('shows the district of last time at once, while the fresh one is asked (G41, docs/108)', async () => {
    localStorage.setItem('here_district', '1726269');
    location.knownPosition.mockReturnValueOnce(new Promise(() => undefined));
    renderMarket(
      <RouteScreen allowWholeRegion onBack={() => undefined} onDone={() => undefined} />,
      testClients({ map: testMap() }),
    );
    expect(await screen.findByText('Chilonzor')).toBeTruthy();
  });

  it('remembers the district found now for the next time', async () => {
    renderMarket(
      <RouteScreen allowWholeRegion onBack={() => undefined} onDone={() => undefined} />,
      testClients({ map: testMap() }),
    );
    await screen.findByText('Chilonzor');
    expect(localStorage.getItem('here_district')).toBe('1726269');
  });
});
