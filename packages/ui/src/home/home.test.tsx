import { BOOKING_LINK, MY_TRIP_LINK } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { approved, DRIVER_ACTIONS, linkOf, PASSENGER_ACTIONS, renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);
const HOUR_MS = 60 * 60 * 1000;
const ROUTE = 'Chilonzor → Fargʻona shahri';

const passenger = (bookings: () => Promise<(typeof booking)[]>, placesFail = 0) =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings,
    placesFail,
    covered: 'find_trip',
  });

describe('the main screen of a passenger (G25)', { timeout: 20_000 }, () => {
  it('asks where to go and starts the search at the end of the way', async () => {
    const { tracked } = passenger(async () => []);
    expect(await screen.findByText('Yoʻnalish')).toBeTruthy();
    await tap('Qayerga borasiz?');
    // The list of the end opens at once (G26, docs/74): the regions to choose from.
    expect(await screen.findByText('Fargʻona viloyati')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'card' }));
  });

  it('starts the search at the start of the way from its line', async () => {
    passenger(async () => []);
    await tap('Qayerdan ketasiz?');
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
  });

  it('says what failed, keeps the main button and tries again', async () => {
    let fail = true;
    const { container, tracked } = passenger(async () => (fail ? Promise.reject(new Error('down')) : []));
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar topish' })).toBeTruthy();
    fail = false;
    await tap('Qayta urinish');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'retry' }));
  });

  it('tries the places again when only they failed', async () => {
    passenger(async () => [booking], 1);
    expect(await screen.findByRole('alert')).toBeTruthy();
    await tap('Qayta urinish');
    expect(await screen.findByLabelText(ROUTE)).toBeTruthy();
  });

  it('shows the nearest bookings, each fact on its own line, and opens one', async () => {
    let status: typeof booking.status = 'requested';
    const { signal } = passenger(async () => [
      { ...booking, status },
      { ...booking, id: 'b2' },
      { ...booking, id: 'b3' },
    ]);
    expect(await screen.findAllByText('Javob kutilmoqda')).toHaveLength(2);
    expect(screen.queryByText('Barcha safarlarim')).toBeNull();
    status = 'confirmed';
    act(signal);
    expect(await screen.findByText('Tasdiqlangan')).toBeTruthy();
    const [first] = screen.getAllByLabelText(ROUTE);
    if (first) fireEvent.click(first);
    expect(screen.getByText(linkOf({ name: BOOKING_LINK, id: booking.id }))).toBeTruthy();
  });

  it('names the day of a trip tomorrow', async () => {
    const departAt = Date.now() + 24 * HOUR_MS;
    passenger(async () => [{ ...booking, trip: { ...trip, departAt } }]);
    expect(await screen.findByText(/^Ertaga, soat \d\d:\d\d/u)).toBeTruthy();
  });
});

const driver = (trips: (typeof trip)[], requests: (typeof booking)[] = [], pending = false) =>
  renderHome(
    (go) => <DriverHome go={go} />,
    DRIVER_ACTIONS,
    { trips: async () => trips, requests: async () => requests, ...(pending ? {} : { covered: 'new_trip' }) },
    pending ? { ...approved, application: { ...approved.application, status: 'pending' } } : approved,
  );

describe('the main screen of a driver (G25)', { timeout: 20_000 }, () => {
  it('shows the nearest trip with its new requests and opens it', async () => {
    driver([trip], [booking, { ...booking, id: 'b2' }]);
    expect(await screen.findByText('2 ta yangi soʻrov')).toBeTruthy();
    fireEvent.click(await screen.findByLabelText(ROUTE));
    expect(screen.getByText(linkOf({ name: MY_TRIP_LINK, id: trip.id }))).toBeTruthy();
  });

  it('says the free seats of a trip without requests, and a full car at a glance', async () => {
    driver([trip, { ...trip, id: 't2', status: 'full', seatsLeft: 0 }]);
    expect(await screen.findByText(/· 3 ta boʻsh joy$/u)).toBeTruthy();
    expect(screen.getByText('Joy qolmagan')).toBeTruthy();
    expect(screen.queryByText('Faol')).toBeNull();
  });

  it('offers the last route of a driver whose trips are over', async () => {
    driver([{ ...trip, status: 'completed' }]);
    expect(screen.getByRole('button', { name: /^Safar eʼlon qilish/u })).toBeTruthy();
    await tap('Oxirgi yoʻnalish');
    expect(screen.getByText('opened Chilonzor>Fargʻona shahri')).toBeTruthy();
  });

  it('shows nothing above the tiles for a driver who never drove, as on the mockup (G53)', async () => {
    driver([]);
    expect(await screen.findByText('Mening safarlarim')).toBeTruthy();
    expect(screen.queryByText('Oxirgi yoʻnalish')).toBeNull();
    expect(screen.getByRole('button', { name: /^Safar eʼlon qilish/u })).toBeTruthy();
  });

  it('does not invite a driver on the check to publish', async () => {
    driver([], [], true);
    expect(await screen.findByText('Mening safarlarim')).toBeTruthy();
    expect(screen.queryByText('Oxirgi yoʻnalish')).toBeNull();
    expect(screen.queryByText('Yoʻnalish')).toBeNull();
  });
});
