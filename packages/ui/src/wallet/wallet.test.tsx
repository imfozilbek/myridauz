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
  const owner = { driverId: 7, firstName: 'Jasur', bonus: 481000, main: 0 };

  it('lets an owner add a bonus by hand with a reason', async () => {
    const adjust = vi.fn<WalletClient['adjust']>(async () => wallet);
    renderMarket(
      <ManagementScreen onBack={() => undefined} />,
      testClients({ wallet: { all: async () => [owner], of: async () => wallet, adjust } }),
    );
    await tap('Hamyonlar');
    await tap('Jasur');
    await tap('Hamyonni tuzatish');
    fireEvent.change(screen.getByLabelText('Summa, soʻm (ayirish uchun minus)'), {
      target: { value: '100000' },
    });
    fireEvent.change(screen.getByLabelText('Sabab'), { target: { value: 'Yoʻlovchi kelmadi' } });
    await tap('Saqlash');
    expect(adjust).toHaveBeenCalledWith(7, { balance: 'bonus', amount: 100000, reason: 'Yoʻlovchi kelmadi' });
  });

  it('tells a moderator that only an owner can do it', async () => {
    const adjust = vi.fn<WalletClient['adjust']>(async () => {
      throw new ApiError(403, 'auth.not_owner');
    });
    renderMarket(
      <ManagementScreen onBack={() => undefined} />,
      testClients({ wallet: { all: async () => [owner], of: async () => wallet, adjust } }),
    );
    await tap('Hamyonlar');
    await tap('Jasur');
    await tap('Hamyonni tuzatish');
    await tap('Asosiy hisob');
    fireEvent.change(screen.getByLabelText('Summa, soʻm (ayirish uchun minus)'), {
      target: { value: '-5000' },
    });
    fireEvent.change(screen.getByLabelText('Sabab'), { target: { value: 'Xato' } });
    await tap('Saqlash');
    expect(await screen.findByText('Buni faqat loyiha egasi qila oladi.')).toBeTruthy();
    expect(adjust.mock.calls[0]?.[1]).toMatchObject({ balance: 'main', amount: -5000 });
  });
});
