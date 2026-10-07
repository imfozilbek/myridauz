import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, ROUTE, takePoint, tap } from './market-test-kit';
import { recentRoutes } from './recent-routes';
import { openRequest } from './request-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const row = (label: string) => screen.getByText(label).closest('button') as HTMLElement;
const more = (index: number) =>
  fireEvent.click(screen.getAllByRole('button', { name: 'Oshirish' })[index] as HTMLElement);

// The route and tomorrow, then «Qayerdan, qayerga?» with both points chosen on their maps.
async function toPoints() {
  await quickRoute();
  await tap(/^Ertaga/);
  expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
  fireEvent.click(row('Olib ketish joyi'));
  await takePoint('Chorsu bozori yaqinida');
  fireEvent.click(await screen.findByText('Tushirish joyi'));
  await takePoint('Yangi Margʻilon');
  await screen.findByText('Qayerdan, qayerga?');
}

describe('«Soʻrov qoldirish» on one screen (G61, docs/118 path 4)', { timeout: 20_000 }, () => {
  it('the people and the price by − and +, the sum, an error of the API, then sent', async () => {
    const publishRequest = openRequest();
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.too_many'));
    await toPoints();
    // The route is one tap away on the main screen next time (G40, docs/106 K9).
    expect(recentRoutes()).toEqual([{ from: ROUTE.from.id, to: ROUTE.to.id }]);
    expect(screen.getByText('Hammasi')).toBeTruthy();
    expect(screen.getByText('Tavsiya: 95 000')).toBeTruthy();
    // A passenger pays no commission: nothing speaks of it (docs/12).
    expect(screen.queryByText(/komissiya/)).toBeNull();
    more(0);
    more(1);
    expect(screen.getByText('2 joy × 100 000')).toBeTruthy();
    expect(screen.getByText('200 000 soʻm')).toBeTruthy();
    await tap('Soʻrov qoldirish');
    expect(
      await screen.findByText('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.'),
    ).toBeTruthy();
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrovni bekor qilish')).toBeTruthy();
    expect(publishRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: '1726269',
        to: '1730401',
        seats: 2,
        price: 100_000,
        pickupMode: 'door',
        pickup: expect.objectContaining({ lat: expect.any(Number) }),
        wholeCar: false,
        withWoman: false,
      }),
    );
  });

  it('sends nothing until both points are chosen', async () => {
    const publishRequest = openRequest();
    await quickRoute();
    await tap(/^Ertaga/);
    await tap('Soʻrov qoldirish');
    expect(publishRequest).not.toHaveBeenCalled();
    expect(screen.getByText('Qayerdan, qayerga?')).toBeTruthy();
  });

  it('«Men bilan ayol bor» for a man with 2 people; «Boʻsh salon kerak» for anyone (docs/06, docs/09)', async () => {
    const publishRequest = openRequest();
    await toPoints();
    expect(screen.queryByText('Men bilan ayol bor')).toBeNull();
    more(0);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Men bilan ayol bor' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Boʻsh salon kerak' }));
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrovni bekor qilish');
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ seats: 2, withWoman: true, wholeCar: true }),
    );
  });

  it('a woman never sees «Men bilan ayol bor»: she gives the mark herself', async () => {
    openRequest({ gender: 'female' });
    await toPoints();
    more(0);
    expect(screen.queryByText('Men bilan ayol bor')).toBeNull();
    expect(screen.getByText('Boʻsh salon kerak')).toBeTruthy();
  });

  it('the pitak on the map of the start: no point at the door (docs/70)', async () => {
    const publishRequest = openRequest();
    await quickRoute();
    await tap(/^Ertaga/);
    fireEvent.click(row('Olib ketish joyi'));
    await tap('Qoʻyliq pitagi');
    fireEvent.click(await screen.findByText('Tushirish joyi'));
    await takePoint('Yangi Margʻilon');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrovni bekor qilish');
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ pickupMode: 'pitak', pickup: null }),
    );
  });

  it('no pitak on the direction: the map has no pitak tile', async () => {
    openRequest({ map: { pitakOf: vi.fn(async () => null) } });
    await quickRoute();
    await tap(/^Ertaga/);
    fireEvent.click(row('Olib ketish joyi'));
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Qoʻyliq pitagi')).toBeNull();
  });

  it('from an empty day: the route, the day and the way of the last time are there at once (K4, K6)', async () => {
    openRequest();
    await toPoints();
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrovni bekor qilish');
    cleanup();
    const publishRequest = openRequest({ search: { route: ROUTE, date: '2030-01-02' } });
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    expect(screen.getAllByText('Oʻzgartirish')).toHaveLength(2);
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrovni bekor qilish');
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2030-01-02', pickupMode: 'door', seats: 1, price: 95_000 }),
    );
  });
});
