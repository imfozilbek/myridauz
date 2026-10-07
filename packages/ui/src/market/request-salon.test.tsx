import type { BookingsClient, MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { offer, request } from '../bookings/booking-test-kit';
import { DriverContext, type Driver } from '../driver/driver-context';
import { testClients } from '../test-shell';
import { recommendation, renderMarket, tap } from './market-test-kit';
import { RequestsSearchFlow } from './requests-search-flow';

afterEach(cleanup);

const driver: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
};

// «Boʻsh salon kerak» (G61, docs/118 path 4): the driver sees it and offers the whole car.
describe('a request for the whole car, as a driver sees it', { timeout: 20_000 }, () => {
  it('says «Boʻsh salon kerak» and counts the commission for every seat of the car', async () => {
    const searchRequests = vi.fn<MarketClient['searchRequests']>(async () => [
      { ...request, wholeCar: true },
    ]);
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    renderMarket(
      <DriverContext.Provider value={driver}>
        <RequestsSearchFlow onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({
        market: { searchRequests, recommend: async () => recommendation },
        bookings: { sendOffer },
      }),
    );
    for (const step of [
      'Qayerdan',
      'Toshkent shahri',
      'Butun shahar',
      'Fargʻona viloyati',
      'Butun viloyat',
      /^Ertaga/,
    ])
      await tap(step);
    expect(await screen.findByText('Boʻsh salon kerak')).toBeTruthy();
    await tap('Dilnoza');
    await tap('Taklif yuborish');
    await tap('Davom etish');
    await tap('Davom etish');
    // The whole car: 4 seats × 95 000, 10% each (docs/09, docs/12).
    expect(await screen.findByText('Butun salon')).toBeTruthy();
    expect(screen.getByText(/38\s000/u)).toBeTruthy();
  });
});
