import type { MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { addAppToHomeScreen } from '../telegram/home-screen';
import { testClients } from '../test-shell';
import { HomeScreenOffer } from './home-screen-offer';

vi.mock('../telegram/home-screen', () => ({
  useCanAddToHomeScreen: () => true,
  addAppToHomeScreen: vi.fn(),
}));

afterEach(cleanup);

const done = { ...trip, status: 'completed' as const };
const show = (trips: (typeof trip)[]) => {
  const myTrips = vi.fn<MarketClient['myTrips']>(async () => trips);
  renderMarket(<HomeScreenOffer />, testClients({ market: { myTrips } }));
};

describe('«Bosh ekranga qoʻshish» for a driver after the 2nd trip (docs/88 L17)', () => {
  it('offers the icon on the phone after two trips and adds it', async () => {
    show([done, { ...done, id: 't2' }]);
    fireEvent.click(await screen.findByText('Bosh ekranga qoʻshish'));
    expect(addAppToHomeScreen).toHaveBeenCalledOnce();
    expect(screen.queryByText('Bosh ekranga qoʻshish')).toBeNull();
  });

  it('waits until the second trip is over', async () => {
    show([done, trip]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText('Bosh ekranga qoʻshish')).toBeNull();
  });
});
