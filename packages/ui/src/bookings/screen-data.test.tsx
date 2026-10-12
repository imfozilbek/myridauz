import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { renderMarket, tap, trip, openOwnTrip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';
import { booking, offer, wallet } from './booking-test-kit';

afterEach(cleanup);

// A test ends with its sheet closed: the timer of the sheet never outlives the file (lesson 235).
const closeSheet = async () => {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
  await sheetClosed();
};

const request = {
  id: 'r1',
  passenger: { id: '00000000000000000000000000000009', firstName: 'Dilnoza', hasAvatar: false },
  from: '1726269',
  to: '1730401',
  date: '2026-10-02',
  km: 320,
  seats: 2,
  price: 95000,
  status: 'open' as const,
  pickupMode: 'both' as const,
  wholeCar: false,
  withWoman: false,
  callsOff: false,
  views: 0,
};

describe('what people need to decide is on the screen (docs/65 C)', () => {
  it('a passenger sees how many offers came and the rating of each driver', async () => {
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [request] },
        bookings: {
          myBookings: async () => [],
          myOffers: async () => [offer, { ...offer, id: 'o2' }],
        },
      }),
    );
    expect(await screen.findByText('2 ta taklif')).toBeTruthy();
    await tap(/· Soʻrov$/u);
    expect(screen.getAllByText(/4,8/)).toHaveLength(2);
  });

  it('a driver sees the answer deadline and the commission before confirming', async () => {
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [booking], driverOffers: async () => [] },
        wallet: { mine: async () => wallet },
      }),
    );
    await openOwnTrip();
    expect(await screen.findByText(/komissiya 19\s000$/u)).toBeTruthy();
    await tap('Dilnoza');
    expect(await screen.findByText(/^Javob berish uchun \d+ (daqiqa|soat)/u)).toBeTruthy();
    // The rule about changing seats is the passenger's, not the driver's (G27).
    expect(screen.queryByText(/^Bron qilingach/)).toBeNull();
    await closeSheet();
  });

  it('a driver without the commission is led to top up, not to a «Tasdiqlash» that fails (G27)', async () => {
    const answer = vi.fn(async () => booking);
    renderMarket(
      <MyTripsScreen onBack={() => undefined} />,
      testClients({
        market: { myTrips: async () => [trip] },
        bookings: { driverBookings: async () => [booking], driverOffers: async () => [], answer },
        wallet: { mine: async () => ({ ...wallet, bonus: 0, main: 0 }) },
      }),
    );
    await openOwnTrip();
    // On the trip and in the sheet the sum short shows and the button leads to the top up (G27, В9).
    expect(await screen.findByText(/^Hamyonda 19\s000 yetmaydi$/u)).toBeTruthy();
    const sent = vi.spyOn(window, 'open').mockReturnValue(null);
    await tap('Hisobni toʻldirish');
    await tap('Dilnoza');
    expect(await screen.findByText('Yangi soʻrov')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Hisobni toʻldirish' }).at(-1) as HTMLElement);
    expect(sent).toHaveBeenCalledTimes(2);
    expect(answer).not.toHaveBeenCalled();
    sent.mockRestore();
    await closeSheet();
  });
});
