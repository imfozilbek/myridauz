import { ApiError, type WalletClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileScreen } from '../account/profile/profile-screen';
import { confirmed, wallet } from '../bookings/booking-test-kit';
import { DriverContext, type Driver } from '../driver/driver-context';
import { renderMarket, tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { testClients } from '../test-shell';
import { WALLET_ACTION } from './wallet-flow';

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

// «Hamyon» opens from its tile on the main screen of an approved driver (docs/118 path 9).
const { Screen: WalletFlow } = WALLET_ACTION;

describe('"Hamyon" of a driver (docs/12, G65 mockups g65/1, g65/2)', () => {
  const profile = () => (
    <DriverContext.Provider value={approved}>
      <WalletFlow onBack={() => undefined} />
    </DriverContext.Provider>
  );

  it('shows the sum, «≈ N joyga yetadi», the bonus and its end, the history', async () => {
    const { tracked } = renderMarket(profile(), testClients({ wallet: { mine: async () => wallet } }));
    expect(await screen.findByText(/^481\s000\ssoʻm$/u)).toBeTruthy();
    expect(screen.getByText('≈ 53 joyga yetadi')).toBeTruthy();
    expect(screen.getByText(/gacha$/)).toBeTruthy();
    expect(screen.getByText('Boshlash bonusi')).toBeTruthy();
    expect(
      screen.getByText('Har tasdiqlangan joy uchun komissiya: joy narxining 10%. Avval bonusdan olinadi.'),
    ).toBeTruthy();
    expect(screen.getByText('Komissiya · Sardor, 2 joy')).toBeTruthy();
    expect(screen.getByText(/^\u221219\s000$/u)).toBeTruthy();
    expect(screen.getByText(/^\+500\s000$/u)).toBeTruthy();
    expect(tracked.some((event) => event.name === 'wallet_open')).toBe(true);
    await tap('Hisobni toʻldirish');
    expect(screen.getByText(/qoʻllab-quvvatlash/)).toBeTruthy();
  });

  it('turns red below 5 seats and asks to top up', async () => {
    renderMarket(profile(), testClients({ wallet: { mine: async () => ({ ...wallet, seatsLeft: 4 }) } }));
    expect(await screen.findByText('≈ 4 joyga yetadi · toʻldiring')).toBeTruthy();
    expect(document.querySelector('.wallet-card-low')).toBeTruthy();
  });

  it('a commission opens its details: the trip, the passenger, the count, the balance', async () => {
    const detail = vi.fn(async () => ({
      kind: 'commission' as const,
      amount: -19_000,
      balances: ['bonus' as const],
      createdAt: Date.parse('2026-10-01T04:00:00Z'),
      booking: { ...confirmed, seats: 2, price: 95_000, commission: 19_000 },
    }));
    renderMarket(profile(), testClients({ wallet: { mine: async () => wallet, detail } }));
    await tap('Komissiya · Sardor, 2 joy');
    expect(await screen.findByText(/^\u221219\s000\ssoʻm$/u)).toBeTruthy();
    expect(detail).toHaveBeenCalledWith('w2');
    expect(screen.getByText('Komissiya 10%')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi toʻlaydi')).toBeTruthy();
    expect(screen.getByText(/^190\s000$/u)).toBeTruthy();
    expect(screen.getByText('Qaysi hisobdan')).toBeTruthy();
    expect(screen.getByText('Safarni ochish')).toBeTruthy();
  });

  it('is not in the profile, not even of a driver (mockup g65/3)', () => {
    renderMarket(
      <DriverContext.Provider value={approved}>
        <ProfileScreen onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({}),
    );
    expect(screen.queryByText('Hamyon')).toBeNull();
  });
});

describe('"Hamyonlar" for the team (docs/12)', () => {
  const owner = { driverId: '00000000000000000000000000000007', firstName: 'Jasur', bonus: 481000, main: 0 };

  it('lets an owner add a bonus by hand with a reason and shows the new balance', async () => {
    const adjust = vi.fn<WalletClient['adjust']>(async () => wallet);
    renderMarket(
      <ManagementScreen onBack={() => undefined} />,
      testClients({
        wallet: { all: async () => ({ wallets: [owner], more: false }), of: async () => wallet, adjust },
      }),
    );
    await tap('Hamyonlar');
    await tap('Jasur');
    await tap('Hamyonni tuzatish');
    const amount = screen.getByLabelText('Summa, soʻm');
    // The label is a section header that wraps, not a field header cut on a 360 px phone (G27).
    expect(amount.getAttribute('placeholder')).toBeNull();
    expect(screen.getByText('Summa, soʻm').closest('label')).toBeNull();
    fireEvent.change(amount, { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Sabab'), { target: { value: 'Yoʻlovchi kelmadi' } });
    // Adding or taking away is a choice, not a minus to remember (docs/86 V2).
    expect(screen.queryByText('Saqlash')).toBeNull();
    await tap('Qoʻshish');
    expect(screen.getByText('Yangi balans')).toBeTruthy();
    expect(screen.getByText(/^581\s000/)).toBeTruthy();
    await tap('Saqlash');
    expect(adjust).toHaveBeenCalledWith('00000000000000000000000000000007', {
      balance: 'bonus',
      amount: 100000,
      reason: 'Yoʻlovchi kelmadi',
    });
  });

  it('tells a moderator that only an owner can do it', async () => {
    const adjust = vi.fn<WalletClient['adjust']>(async () => {
      throw new ApiError(403, 'auth.not_owner');
    });
    renderMarket(
      <ManagementScreen onBack={() => undefined} />,
      testClients({
        wallet: { all: async () => ({ wallets: [owner], more: false }), of: async () => wallet, adjust },
      }),
    );
    await tap('Hamyonlar');
    await tap('Jasur');
    await tap('Hamyonni tuzatish');
    await tap('Asosiy hisob');
    await tap('Ayirish');
    fireEvent.change(screen.getByLabelText('Summa, soʻm'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('Sabab'), { target: { value: 'Xato' } });
    expect(screen.getByText(/^-5\s000/)).toBeTruthy();
    await tap('Saqlash');
    expect(await screen.findByText('Buni faqat loyiha egasi qila oladi.')).toBeTruthy();
    expect(adjust.mock.calls[0]?.[1]).toMatchObject({ balance: 'main', amount: -5000 });
  });
});
