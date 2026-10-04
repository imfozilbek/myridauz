import { ApiError, type WalletClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileScreen } from '../account/profile/profile-screen';
import { wallet } from '../bookings/booking-test-kit';
import { DriverContext, type Driver } from '../driver/driver-context';
import { renderMarket, tap } from '../market/market-test-kit';
import { ManagementScreen } from '../pricing/management-screen';
import { testClients } from '../test-shell';

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

describe('"Hamyon" of a driver (docs/12)', () => {
  it('opens from the profile: the bonus, its end, the history', async () => {
    const { tracked } = renderMarket(
      <DriverContext.Provider value={approved}>
        <ProfileScreen onBack={() => undefined} />
      </DriverContext.Provider>,
      testClients({ wallet: { mine: async () => wallet } }),
    );
    await tap('Hamyon');
    expect(await screen.findByText(/481\s000/)).toBeTruthy();
    expect(screen.getByText(/gacha$/)).toBeTruthy();
    expect(screen.getByText('Bonus berildi')).toBeTruthy();
    // The rule of the commission in one line (docs/86 V8).
    expect(
      screen.getByText(
        'Komissiya yoʻlovchi joyini tasdiqlaganingizda olinadi: avval bonusdan, keyin asosiy hisobdan.',
      ),
    ).toBeTruthy();
    expect(screen.getByText(/-19\s000/)).toBeTruthy();
    expect(tracked.some((event) => event.name === 'wallet_open')).toBe(true);
    await tap('Hisobni toʻldirish');
    expect(screen.getByText(/qoʻllab-quvvatlash/)).toBeTruthy();
  });

  it('is not in the profile of a passenger', () => {
    renderMarket(<ProfileScreen onBack={() => undefined} />, testClients({}));
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
