import { toCyrillic } from '@platform/i18n';
import { DAY_MS, tashkentDate, tashkentDayStart, type Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { openOwnTrip, recommendation, renderMarket, tap, trip } from './market-test-kit';
import { MyTripsScreen } from './my-trips-screen';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const MINUTE = 60 * 1000;
// Tomorrow 08:00 in Tashkent: a trip ahead with its first time.
const AT = tashkentDayStart(tashkentDate(Date.now() + DAY_MS)) + 8 * 60 * MINUTE;
const own: Trip = { ...trip, departAt: AT, firstDepartAt: AT };

function open(market: Record<string, unknown>, mine: Trip = own) {
  vi.stubGlobal('confirm', () => true);
  renderMarket(
    <MyTripsScreen onBack={() => undefined} />,
    testClients({
      market: { myTrips: async () => [mine], recommend: async () => recommendation, ...market },
      bookings: { driverBookings: async () => [], driverOffers: async () => [] },
    }),
  );
  return openOwnTrip();
}

describe('the driver changes the own trip (G39, docs/104)', () => {
  it('moves the time only later, at most +1 hour in all', async () => {
    const retimeTrip = vi.fn(async (_id: string, departAt: number) => ({ ...own, departAt }));
    await open({ retimeTrip });
    await tap(toCyrillic('Vaqt yoki narx'));
    // One sheet over «Mening safarim» for both changes (G75, mockup g75/3 A phone 2): the time first.
    expect(screen.getByText(toCyrillic('Yoʻlovchilar (0)'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('soat 09:00'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('soat 09:15'))).toBeNull();
    await tap(toCyrillic('soat 08:30'));
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Ha, oʻzgartirish') }));
    await vi.waitFor(() => expect(retimeTrip).toHaveBeenCalledWith('t1', AT + 30 * MINUTE));
    expect(await screen.findByText(toCyrillic('Yoʻlovchilar (0)'))).toBeTruthy();
  });

  it('lowers the price by the steps of the route, not below the bound', async () => {
    const lowerTripPrice = vi.fn(async (_id: string, price: number) => ({ ...own, price }));
    await open({ lowerTripPrice });
    await tap(toCyrillic('Vaqt yoki narx'));
    await tap(toCyrillic('Narxni tushirish'));
    await tap(/^85.000/);
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Ha, oʻzgartirish') }));
    await vi.waitFor(() => expect(lowerTripPrice).toHaveBeenCalledWith('t1', 85000));
  });

  it('goes straight to the price after the whole hour is used', async () => {
    await open({}, { ...own, departAt: AT + 60 * MINUTE });
    await tap(toCyrillic('Vaqt yoki narx'));
    expect(await screen.findByText(/^85.000/)).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Vaqtni surish'))).toBeNull();
  });
});
