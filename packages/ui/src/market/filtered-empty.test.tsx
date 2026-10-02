import type { MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { chooseRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(cleanup);

const atPitak = { ...trip, id: 't2', pickupMode: 'pitak' as const, woman: false };

describe('a search emptied by a filter says so (docs/89 P6)', () => {
  it('counts the trips the filters hid and turns them off in one tap', async () => {
    // «Mashinada ayol bor» is asked from the server: without it there is one trip, at a pitak.
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async (search) => (search.woman ? [] : [atPitak]));
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await chooseRoute();
    await tap(/^Bugun/);
    expect(await screen.findByText('Jasur')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Uyimdan olib ketsin' }));
    expect(await screen.findByText('Filtr 1 ta safarni yashirdi')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mashinada ayol bor' }));
    expect(await screen.findByText('Filtr 1 ta safarni yashirdi')).toBeTruthy();
    await tap('Filtrni oʻchirish');
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: 'Mashinada ayol bor' }) as HTMLInputElement).checked).toBe(
      false,
    );
  });

  it('keeps «Bu kunga safar topilmadi» when no filter hid anything', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [] } }),
    );
    await chooseRoute();
    await tap(/^Bugun/);
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
    expect(screen.queryByText('Filtrni oʻchirish')).toBeNull();
  });
});
