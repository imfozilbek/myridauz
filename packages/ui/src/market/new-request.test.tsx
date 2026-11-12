import { toCyrillic } from '@platform/i18n';
import { ApiError } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, ROUTE, takePoint, tap } from './market-test-kit';
import { recentRoutes } from './recent-routes';
import { openRequest, row, toPoints } from './request-test-kit';
import { pickDay } from '../days/week-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const more = (index: number) =>
  fireEvent.click(screen.getAllByRole('button', { name: toCyrillic('Oshirish') })[index] as HTMLElement);

describe('«Soʻrov qoldirish» on one screen (G61, docs/118 path 4)', { timeout: 20_000 }, () => {
  it('the people and the price by − and +, the sum, an error of the API, then sent', async () => {
    const publishRequest = openRequest();
    publishRequest.mockRejectedValueOnce(new ApiError(409, 'trips.too_many'));
    await toPoints();
    // The route is one tap away on the main screen next time (G40, docs/106 K9).
    expect(recentRoutes()).toEqual([{ from: ROUTE.from.id, to: ROUTE.to.id }]);
    expect(screen.getByText(toCyrillic('Hammasi'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Tavsiya: 95 000'))).toBeTruthy();
    // A passenger pays no commission: nothing speaks of it (docs/12).
    expect(screen.queryByText(/комиссия/)).toBeNull();
    more(0);
    more(1);
    expect(screen.getByText(toCyrillic('2 joy × 100 000'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('200 000 soʻm'))).toBeTruthy();
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(
      await screen.findByText(toCyrillic('Faol eʼlonlar soni chegaraga yetdi. Eskisini bekor qiling.')),
    ).toBeTruthy();
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(await screen.findByText(toCyrillic('Soʻrovni bekor qilish'))).toBeTruthy();
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

  // G91 WALK-1: the button never does nothing in silence (many phones give no vibration): it opens
  // the point still missing, then sends.
  it('opens the point still missing instead of sending, then the other one', async () => {
    const publishRequest = openRequest();
    await quickRoute();
    await pickDay(1);
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(publishRequest).not.toHaveBeenCalled();
    await takePoint(toCyrillic('Chorsu bozori yaqinida'));
    expect(await screen.findByText(toCyrillic('Qayerda tushasiz?'))).toBeTruthy();
  });

  it('«Men bilan ayol bor» for a man with 2 people; «Boʻsh salon kerak» for anyone (docs/06, docs/09)', async () => {
    const publishRequest = openRequest();
    await toPoints();
    expect(screen.queryByText(toCyrillic('Men bilan ayol bor'))).toBeNull();
    more(0);
    fireEvent.click(screen.getByRole('checkbox', { name: toCyrillic('Men bilan ayol bor') }));
    fireEvent.click(screen.getByRole('checkbox', { name: toCyrillic('Boʻsh salon kerak') }));
    await tap(toCyrillic('Soʻrov qoldirish'));
    await screen.findByText(toCyrillic('Soʻrovni bekor qilish'));
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ seats: 2, withWoman: true, wholeCar: true }),
    );
  });

  it('a woman never sees «Men bilan ayol bor»: she gives the mark herself', async () => {
    openRequest({ gender: 'female' });
    await toPoints();
    more(0);
    expect(screen.queryByText(toCyrillic('Men bilan ayol bor'))).toBeNull();
    expect(screen.getByText(toCyrillic('Boʻsh salon kerak'))).toBeTruthy();
  });

  it('the pitak on the map of the start: no point at the door (docs/70)', async () => {
    const publishRequest = openRequest();
    await quickRoute();
    await pickDay(1);
    fireEvent.click(row(toCyrillic('Olib ketish joyi')));
    await tap(toCyrillic('Qoʻyliq pitagi'));
    await takePoint(toCyrillic('Yangi Margʻilon'));
    await tap(toCyrillic('Soʻrov qoldirish'));
    await screen.findByText(toCyrillic('Soʻrovni bekor qilish'));
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ pickupMode: 'pitak', pickup: null }),
    );
  });

  it('no pitak on the direction: the map has no pitak tile', async () => {
    openRequest({ map: { pitakOf: vi.fn(async () => null) } });
    await quickRoute();
    await pickDay(1);
    fireEvent.click(row(toCyrillic('Olib ketish joyi')));
    expect(await screen.findByText(toCyrillic('Qayerdan olib ketsin?'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Qoʻyliq pitagi'))).toBeNull();
  });

  it('from an empty day: the route, the day and the way of the last time are there at once (K4, K6)', async () => {
    openRequest();
    await toPoints();
    await tap(toCyrillic('Soʻrov qoldirish'));
    await screen.findByText(toCyrillic('Soʻrovni bekor qilish'));
    cleanup();
    const publishRequest = openRequest({ search: { route: ROUTE, date: '2030-01-02' } });
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('Oʻzgartirish'))).toHaveLength(2);
    await tap(toCyrillic('Soʻrov qoldirish'));
    await screen.findByText(toCyrillic('Soʻrovni bekor qilish'));
    expect(publishRequest).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2030-01-02', pickupMode: 'door', seats: 1, price: 95_000 }),
    );
  });
});
