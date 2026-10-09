import { BOOKING_LINK, DAY_MS, MINUTE_MS } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed, TRIP_DAY } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { linkOf, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);
const NAME = 'Jasur · Fargʻona';

const passenger = (bookings: () => Promise<(typeof booking)[]>, placesFail = 0) =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings, placesFail });
const tomorrow = (seat: typeof booking) => ({ ...seat, trip: { ...trip, departAt: Date.now() + DAY_MS } });

describe('the main screen of a passenger (G25, G66 mockup g66/1)', { timeout: 20_000 }, () => {
  it('shows the nearest seat as one card: when, its state, the driver, the car; a tap opens it', async () => {
    let status: typeof booking.status = 'requested';
    const { signal } = passenger(async () => [
      tomorrow({ ...booking, status }),
      { ...tomorrow(booking), id: 'b2', trip: { ...trip, departAt: Date.now() + 2 * DAY_MS } },
    ]);
    expect(await screen.findByText(/^Ertaga \d\d:\d\d · Javob kutilmoqda$/u)).toBeTruthy();
    expect(screen.getAllByText(NAME)).toHaveLength(1);
    expect(screen.getByText('Cobalt, Oq')).toBeTruthy();
    // Before the confirmation: the chat only, the call comes with the seat (docs/07).
    expect(screen.getByRole('button', { name: 'Xabar yozish' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Qoʻngʻiroq' })).toBeNull();
    status = 'confirmed';
    act(signal);
    expect(await screen.findByText(/^Ertaga \d\d:\d\d · Joy tasdiqlandi$/u)).toBeTruthy();
    fireEvent.click(screen.getByText(NAME));
    expect(screen.getByText(linkOf({ name: BOOKING_LINK, id: booking.id }))).toBeTruthy();
  });

  it('opens the chat and the call with the driver right from the card', async () => {
    const { tracked } = passenger(async () => [tomorrow({ ...confirmed, plate: '01A123BC', unread: 2 })]);
    expect(await screen.findByText('Cobalt, Oq · 01 A 123 BC')).toBeTruthy();
    // «2 xabar» of the driver not read yet, on the chat (G53).
    expect(screen.getByLabelText('2 xabar').textContent).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: 'Qoʻngʻiroq' }));
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'trip_call' }));
    expect(screen.queryByText(NAME)).toBeNull();
  });

  it('shows the meeting instead of the card 30 minutes before the departure (docs/126)', async () => {
    const departAt = Date.now() + 20 * MINUTE_MS;
    passenger(async () => [{ ...confirmed, trip: { ...trip, departAt } }]);
    expect(await screen.findByRole('region', { name: 'Uchrashuv' })).toBeTruthy();
    expect(screen.getByText('Men keldim')).toBeTruthy();
    expect(screen.queryByText(NAME)).toBeNull();
  });

  it('gives the main button to the step of the trip on its day, no search then', async () => {
    vi.setSystemTime(TRIP_DAY);
    passenger(async () => [confirmed]);
    expect(await screen.findByRole('button', { name: 'Mashinaga chiqdim' })).toBeTruthy();
    expect(screen.queryByText('Safar topish')).toBeNull();
    expect(screen.queryByText('Qayerga borasiz?')).toBeNull();
    cleanup();
    passenger(async () => [{ ...confirmed, boardedAt: TRIP_DAY }]);
    expect(await screen.findByRole('button', { name: 'Yetib keldim' })).toBeTruthy();
  });

  it('shows the profile, «Qayerdan / Qayerga» and «Safar topish» without a trip today, no menu at the bottom', async () => {
    const { container } = passenger(async () => []);
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.getByText('Yoʻlovchi')).toBeTruthy();
    expect(screen.getByText('Qayerdan ketasiz?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar topish' })).toBeTruthy();
    expect(container.querySelector('nav, [role="tablist"]')).toBeNull();
  });

  it('says what failed, keeps the main button and tries again', async () => {
    let fail = true;
    const { tracked } = passenger(async () => (fail ? Promise.reject(new Error('down')) : []));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar topish' })).toBeTruthy();
    fail = false;
    await tap('Qayta urinish');
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'retry' }));
  });

  it('tries the places again when only they failed', async () => {
    passenger(async () => [tomorrow(booking)], 1);
    expect(await screen.findByRole('alert')).toBeTruthy();
    await tap('Qayta urinish');
    expect(await screen.findByText(NAME)).toBeTruthy();
  });
});
