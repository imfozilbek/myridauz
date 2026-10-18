import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
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
    photos: { front: true },
    reasons: [],
  },
  editCar: () => undefined,
};
const { Screen: WalletFlow } = WALLET_ACTION;

// «Hamyon» → the details of a commission → «Safarni ochish» → Telegram «Назад» (G77, docs/168 B):
// «Hamyon» stays under the trip, so «Назад» comes back to the very details, not to the list.
function openDetails() {
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
  return renderMarket(
    <DriverContext.Provider value={approved}>
      <WalletFlow onBack={() => undefined} />
    </DriverContext.Provider>,
    clients,
    'male',
    true,
  );
}

describe('the trip opened from the details of «Hamyon»', { timeout: 20_000 }, () => {
  it('«Назад» comes back to the details', async () => {
    openDetails();
    await tap('Komissiya · Sardor, 2 joy');
    await tap('Safarni ochish');
    expect(await screen.findByText(/^Yoʻlovchilar \(/u)).toBeTruthy();
    act(pressBack);
    expect(screen.queryByText(/^Yoʻlovchilar \(/u)).toBeNull();
    expect(screen.getByText('Komissiya 10%')).toBeTruthy();
  });

  // The row of the passenger opens the booking itself, not the list of trips (G77).
  it('the row of the passenger opens that booking; «Назад» comes back to the details', async () => {
    const { tracked } = openDetails();
    await tap('Komissiya · Sardor, 2 joy');
    await screen.findByText('Komissiya 10%');
    fireEvent.click(document.querySelector('button.wallet-rider') as HTMLElement);
    await waitFor(() => expect(tracked.some((event) => event.screen === 'bookings.driver')).toBe(true));
    expect(screen.queryByText(/^Faol \(/u)).toBeNull();
    act(pressBack);
    expect(await screen.findByText('Komissiya 10%')).toBeTruthy();
  });
});
