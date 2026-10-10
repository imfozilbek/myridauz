import { BOOKING_LINK, DAY_MS, MINUTE_MS } from '@platform/contracts';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed, TRIP_DAY } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { linkOf, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);
const passenger = (bookings: () => Promise<(typeof booking)[]>, placesFail = 0) =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings, placesFail });
const at = (departAt: number) => ({ ...trip, departAt, firstDepartAt: departAt });
const tomorrow = (seat: typeof booking) => ({ ...seat, trip: at(Date.now() + DAY_MS) });
const dock = () => within(screen.getByTestId('home-dock'));

describe('the block at the bottom of a passenger (G76, mockup g76/2)', { timeout: 20_000 }, () => {
  it('shows the nearest seat: its state, when, the driver with the car; then the confirmation', async () => {
    let status: typeof booking.status = 'requested';
    const { signal } = passenger(async () => [
      tomorrow({ ...booking, status }),
      { ...tomorrow(booking), id: 'b2', trip: at(Date.now() + 2 * DAY_MS) },
    ]);
    expect(await screen.findByText('Javob kutilmoqda')).toBeTruthy();
    expect(dock().getByText('Jasur')).toBeTruthy();
    expect(dock().getByText(/^Cobalt, oq/u)).toBeTruthy();
    // Before the confirmation: the chat only, the call comes with the seat (docs/07).
    expect(dock().queryByRole('button', { name: 'Qoʻngʻiroq' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Bekor qilish' })).toBeTruthy();
    status = 'confirmed';
    act(signal);
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Safarni ochish' }));
    expect(screen.getByText(linkOf({ name: BOOKING_LINK, id: booking.id }))).toBeTruthy();
  });

  it('calls the driver from the card; an unread message puts a dot on the chat', async () => {
    const { tracked } = passenger(async () => [tomorrow({ ...confirmed, plate: '01A123BC', unread: 2 })]);
    expect(await screen.findByText('Cobalt, oq · 01 A 123 BC')).toBeTruthy();
    expect(screen.getByTestId('home-dock').querySelector('.dock-tool-unread .dock-tool-dot')).toBeTruthy();
    fireEvent.click(dock().getAllByRole('button', { name: 'Qoʻngʻiroq' })[0] as HTMLElement);
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'trip_call' }));
  });

  it('opens the meeting 30 minutes before the departure with «Men keldim» (docs/126)', async () => {
    const departAt = Date.now() + 20 * MINUTE_MS;
    passenger(async () => [{ ...confirmed, trip: at(departAt) }]);
    expect(await screen.findByRole('button', { name: 'Men keldim' })).toBeTruthy();
    expect(screen.getByText('Hozir: joyga boring')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Safar topish' })).toBeNull();
    // After «Men keldim» the driver's «Keldi» puts the passenger in the car: the map until then (G76).
    cleanup();
    passenger(async () => [{ ...confirmed, trip: at(departAt), cameAt: Date.now() }]);
    expect(await screen.findByRole('button', { name: 'Xaritada ochish' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Men keldim' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Mashinaga chiqdim' })).toBeNull();
  });

  it('says where exactly to stand at the pitak and that the driver is on the way, without minutes', async () => {
    const departAt = Date.now() + 20 * MINUTE_MS;
    const pitak = {
      id: 'p1',
      name: 'Chilonzor pitagi',
      point: { lat: 41.28, lng: 69.2 },
      hint: 'Metro yonida',
    };
    const onWay = { ...at(departAt), departedAt: Date.now() };
    passenger(async () => [{ ...confirmed, mode: 'pitak', pitak, pickup: null, trip: onWay }]);
    expect(await screen.findByText('Metro yonida · Jasur yoʻlda')).toBeTruthy();
  });

  it('keeps the search before the meeting, the step of the trip after it', async () => {
    // The morning of the trip day, 2 hours before: the seat is confirmed, the search is a tap away.
    vi.setSystemTime(TRIP_DAY);
    passenger(async () => [confirmed]);
    expect(await screen.findByText('Joy tasdiqlandi')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Men keldim' })).toBeNull();
    cleanup();
    passenger(async () => [{ ...confirmed, boardedAt: Date.now() }]);
    expect(await screen.findByRole('button', { name: 'Yetib keldim' })).toBeTruthy();
  });

  it('is free with nothing: the head, «Qayerdan / Qayerga», «Soʻrov qoldirish» and «Safar topish»', async () => {
    const { container } = passenger(async () => []);
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi')).toBeTruthy();
    expect(screen.getByText('Qayerdan ketasiz?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar topish' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Soʻrov qoldirish' })).toBeTruthy();
    // A new person with nothing yet is shown where to start (mockup g76/2 state 1).
    expect(await screen.findByText('Bu yerdan boshlang')).toBeTruthy();
    expect(container.querySelector('nav, [role="tablist"]')).toBeNull();
  });

  it('says what failed, keeps the buttons and tries again', async () => {
    let fail = true;
    const { tracked } = passenger(async () => (fail ? Promise.reject(new Error('down')) : []));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar topish' })).toBeTruthy();
    fail = false;
    await tap('Qayta urinish');
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'retry' }));
  });

  it('tries the places again when only they failed', async () => {
    // The block and the sheets load the places each: both fail.
    passenger(async () => [tomorrow(booking)], 2);
    expect(await screen.findByRole('alert')).toBeTruthy();
    await tap('Qayta urinish');
    expect(await screen.findByText('Javob kutilmoqda')).toBeTruthy();
  });
});

describe('a trip of a saved driver (G76, mockup g76/2 state 3)', { timeout: 20_000 }, () => {
  it('offers it in the block once, «Boshqa safar» puts it aside', async () => {
    const later = at(Date.now() + DAY_MS);
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
      bookings: async () => [],
      favorites: async () => ({ drivers: [later.driver], trips: [later] }),
    });
    expect(await screen.findByText('Siz uchun safar')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Boshqa safar' }));
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
  });
});
