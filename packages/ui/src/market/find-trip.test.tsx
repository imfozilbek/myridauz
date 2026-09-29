import type { MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { chooseRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(cleanup);

describe('FindTripFlow: a passenger looks for a trip (docs/06, docs/14)', () => {
  it('searches a whole region on a day, filters "ayol bor" and opens a trip', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip]);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips } }),
    );
    await chooseRoute(true);
    await tap(/^Bugun/);
    expect(await screen.findByText('Jasur')).toBeTruthy();
    // Every stop shows two levels: the place and its region, and the arrival is approximate.
    expect(screen.getAllByText('Toshkent shahri').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^≈ \d\d:\d\d$/).length).toBeGreaterThan(0);
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726269', to: '1730' });
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0]).toMatchObject({ woman: '1' }));
    await tap('Jasur');
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect(screen.getByText('Uchrashuv joyi belgilangan')).toBeTruthy();
    await tap('Joy band qilish');
    expect(screen.getByText('Joy band qilish tez orada ishga tushadi.')).toBeTruthy();
    expect(tracked.some((event) => event.name === 'trip_open')).toBe(true);
    expect(tracked.find((event) => event.name === 'trip_search')).toMatchObject({ result: 'found' });
  });

  it('says so when nothing is found, and a calendar day can be chosen', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await chooseRoute();
    await tap('Boshqa kun');
    const day = screen.getByLabelText('Qaysi kuni?') as HTMLInputElement;
    fireEvent.change(day, { target: { value: day.min } });
    await tap('Davom etish');
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
  });
});
