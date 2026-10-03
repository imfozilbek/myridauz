import { ApiError } from '@platform/api-client';
import type { Location } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, takePoint, tap } from './market-test-kit';
import { recentRoutes } from './recent-routes';
import { openRequest } from './request-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const place = (id: string, parentId: string, name: string): Location => ({
  id,
  parentId,
  type: 'district',
  name,
  lat: 41,
  lng: 69,
  oneCity: false,
});
const ROUTE = {
  from: place('1726269', '1726', 'Chilonzor'),
  to: place('1730401', '1730', 'Fargʻona shahri'),
};

describe('NewRequestFlow: "Soʻrov qoldirish" (G35, docs/97)', { timeout: 20_000 }, () => {
  it('asks the route, day, way, both points and price, explains an error of the API and publishes', async () => {
    const publishRequest = openRequest();
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.too_many'));
    await quickRoute();
    await tap(/^Ertaga/);
    expect(await screen.findByRole('progressbar')).toBeTruthy();
    await tap('Uyimdan');
    await takePoint('Chorsu bozori yaqinida');
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await takePoint('Yangi Margʻilon');
    // A passenger pays no commission: the price step does not speak of it (docs/12).
    expect(await screen.findByText(/^Tavsiya/)).toBeTruthy();
    expect(screen.queryByText(/komissiya/)).toBeNull();
    await tap('Davom etish');
    expect(await screen.findByText('Soʻrovni tekshiring')).toBeTruthy();
    // PS14, K3: the hint says what drivers do; 1 person at first, «+» in the check.
    expect(screen.getByText(/narxingizni koʻradi/u)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Oshirish' }));
    await tap('Soʻrov qoldirish');
    expect(
      await screen.findByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.'),
    ).toBeTruthy();
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrov qoldirildi')).toBeTruthy();
    expect(publishRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: '1726269',
        to: '1730401',
        seats: 2,
        price: 95000,
        pickupMode: 'door',
        pickup: expect.objectContaining({ lat: expect.any(Number) }),
      }),
    );
  });

  it('takes the door without a choice of one where the direction has no pitak (PS8)', async () => {
    openRequest({ map: { pitakOf: vi.fn(async () => null) } });
    await quickRoute();
    // The route is one tap away on the main screen next time (G40, docs/106 K9).
    expect(recentRoutes()).toEqual([{ from: ROUTE.from.id, to: ROUTE.to.id }]);
    await tap(/^Ertaga/);
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Pitakdan')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('asks no point at the door for «Pitakdan»', async () => {
    const publishRequest = openRequest();
    await quickRoute();
    await tap(/^Ertaga/);
    await tap('Pitakdan');
    await takePoint('Yangi Margʻilon');
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrov qoldirildi');
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ pickupMode: 'pitak', pickup: null }),
    );
  });

  it('from an empty day keeps the route, the day and the way of the last time: price and check (K4, K6)', async () => {
    openRequest();
    await quickRoute();
    await tap(/^Ertaga/);
    await tap('Uyimdan');
    await takePoint('Chorsu bozori yaqinida');
    await takePoint('Yangi Margʻilon');
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrov qoldirildi');
    cleanup();
    const publishRequest = openRequest({ search: { route: ROUTE, date: '2030-01-02' } });
    expect(await screen.findByText(/^Tavsiya/)).toBeTruthy();
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrov qoldirildi');
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2030-01-02', pickupMode: 'door', seats: 1 }),
    );
  });
});
