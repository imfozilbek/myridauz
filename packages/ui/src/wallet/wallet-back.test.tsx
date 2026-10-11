import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { DriverContext, type Driver } from '../driver/driver-context';
import { renderMarket, tap } from '../market/market-test-kit';
import { pressBack } from '../test-native';
import { testClients } from '../test-shell';
import { WALLET_ACTION } from './wallet-flow';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));
afterEach(cleanup);

const approved: Driver = {
  application: {
    status: 'approved',
    car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 },
    photos: { front: true, side: true, interior: true },
    reasons: [],
  },
  editCar: () => undefined,
};
const { Screen: WalletFlow } = WALLET_ACTION;

// «Hamyon» → the details of a commission → «Safarni ochish» → Telegram «Назад» (G77, docs/168 B):
// «Hamyon» stays under the trip, so «Назад» comes back to the very details, not to the list.
describe('the trip opened from the details of «Hamyon»', () => {
  it('«Назад» comes back to the details', async () => {
    const detail = vi.fn(async () => ({
      kind: 'commission' as const,
      amount: -19_000,
      balances: ['bonus' as const],
      createdAt: Date.parse('2026-10-01T04:00:00Z'),
      booking: { ...confirmed, seats: 2, price: 95_000, commission: 19_000 },
    }));
    const clients = testClients({
      wallet: { mine: async () => wallet, detail },
      market: { myTrips: async () => [confirmed.trip] },
      bookings: { driverBookings: async () => [confirmed], driverOffers: async () => [] },
    });
    renderMarket(
      <DriverContext.Provider value={approved}>
        <WalletFlow onBack={() => undefined} />
      </DriverContext.Provider>,
      clients,
      'male',
      true,
    );
    await tap('Komissiya · Sardor, 2 joy');
    await tap('Safarni ochish');
    expect(await screen.findByText(/^Yoʻlovchilar \(/u)).toBeTruthy();
    act(pressBack);
    expect(screen.queryByText(/^Yoʻlovchilar \(/u)).toBeNull();
    expect(screen.getByText('Komissiya 10%')).toBeTruthy();
  });
});
