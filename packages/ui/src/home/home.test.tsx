import { BOOKING_LINK, MY_TRIP_LINK } from '@platform/contracts';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { approved, DRIVER_ACTIONS, linkOf, PASSENGER_ACTIONS, renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);

const passenger = (bookings: () => Promise<(typeof booking)[]>) =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings });

describe('the main screen of a passenger (G25)', { timeout: 20_000 }, () => {
  it('asks where to go and starts the search at the end of the way', async () => {
    const { tracked } = passenger(async () => []);
    await tap('Qayerga borasiz?');
    expect(await screen.findByText('Uyingiz qayerda?')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'card' }));
  });

  it('starts the search at the start of the way from its line', async () => {
    passenger(async () => []);
    await tap('Qayerdan ketasiz?');
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
  });

  it('keeps the place while loading and offers to try again after a failure', async () => {
    let fail = true;
    const { container } = passenger(async () => (fail ? Promise.reject(new Error('down')) : []));
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    fail = false;
    await tap('Qayta urinish');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
  });

  it('shows the nearest booking, changes its status by itself and opens it', async () => {
    let status: typeof booking.status = 'requested';
    const { signal } = passenger(async () => [{ ...booking, status }]);
    expect(await screen.findByText(/Javob kutilmoqda/u)).toBeTruthy();
    expect(screen.getByText('Chilonzor → Fargʻona shahri')).toBeTruthy();
    status = 'confirmed';
    act(signal);
    expect(await screen.findByText(/Tasdiqlangan/u)).toBeTruthy();
    await tap('Chilonzor → Fargʻona shahri');
    expect(screen.getByText(linkOf({ name: BOOKING_LINK, id: booking.id }))).toBeTruthy();
  });
});

const driver = (trips: (typeof trip)[], requests: (typeof booking)[] = [], pending = false) =>
  renderHome(
    (go) => <DriverHome go={go} />,
    DRIVER_ACTIONS,
    { trips: async () => trips, requests: async () => requests },
    pending ? { ...approved, application: { ...approved.application, status: 'pending' } } : approved,
  );

describe('the main screen of a driver (G25)', { timeout: 20_000 }, () => {
  it('shows the nearest trip with its new requests and opens it', async () => {
    driver([trip], [booking, { ...booking, id: 'b2' }]);
    expect(await screen.findByText(/2 ta yangi soʻrov/u)).toBeTruthy();
    // The counter beside the trip, like the unread one of Telegram.
    expect(screen.getByText('2')).toBeTruthy();
    await tap('Chilonzor → Fargʻona shahri');
    expect(screen.getByText(linkOf({ name: MY_TRIP_LINK, id: trip.id }))).toBeTruthy();
  });

  it('offers the last route of a driver whose trips are over', async () => {
    driver([{ ...trip, status: 'completed' }]);
    expect(await screen.findByText('Qayerga ketyapsiz?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar eʼlon qilish' })).toBeTruthy();
    await tap('Oxirgi yoʻnalish');
    expect(screen.getByText('opened Chilonzor>Fargʻona shahri')).toBeTruthy();
  });

  it('asks a new driver where they go; a driver on the check publishes nothing yet', async () => {
    driver([], [], true);
    await tap('Qayerga ketyapsiz?');
    expect(screen.getByText('opened empty')).toBeTruthy();
    cleanup();
    driver([], [], true);
    await screen.findByText('Qayerga ketyapsiz?');
    expect(screen.queryByRole('button', { name: 'Safar eʼlon qilish' })).toBeNull();
  });
});
