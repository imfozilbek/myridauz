import { arrivalAt } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { tap } from '../market/market-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { sheetClosed } from './sheet-closed';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const arrival = arrivalAt(confirmed.trip.departAt, confirmed.trip.km);
const home = () =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [confirmed] });

describe('«Yetib keldingizmi?» an hour after the arrival (docs/129, docs/43, mockup g60/6)', () => {
  it('asks the passenger who has not told it yet; «Hali yoʻldaman» closes it', async () => {
    vi.setSystemTime(arrival + HOUR + 1);
    home();
    expect(await screen.findByText('Yetib keldingizmi?')).toBeTruthy();
    expect(screen.getByText('Ha, yetib keldim')).toBeTruthy();
    await tap('Hali yoʻldaman');
    expect(screen.queryByText('Yetib keldingizmi?')).toBeNull();
    await sheetClosed();
  });

  it('hides the main button while the sheet is open: it would cover «Hali yoʻldaman»', async () => {
    vi.setSystemTime(arrival + HOUR + 1);
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
      bookings: async () => [confirmed],
    });
    expect(await screen.findByText('Yetib keldingizmi?')).toBeTruthy();
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
    await tap('Hali yoʻldaman');
    // On the day of the trip the main button is its step (G66).
    expect(await screen.findByText('Mashinaga chiqdim')).toBeTruthy();
    await sheetClosed();
  });

  it('does not ask before the hour', async () => {
    vi.setSystemTime(arrival + HOUR - 60_000);
    home();
    await screen.findByText('Men keldim');
    expect(screen.queryByText('Yetib keldingizmi?')).toBeNull();
  });
});
