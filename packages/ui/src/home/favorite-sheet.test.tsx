import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Booking } from '@platform/contracts';
import { confirmed } from '../bookings/booking-test-kit';
import { trip } from '../market/market-test-kit';
import { tap } from '../market/market-test-kit';
import { PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { sheetClosed } from './sheet-closed';
import { PassengerHome } from './passenger-home';

afterEach(cleanup);

const driver = { ...trip.driver, car: trip.driver.car };
const home = (bookings: Booking[] = []) =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => bookings,
    favorites: async () => ({ drivers: [driver], trips: [trip] }),
  });

describe('«Sevimli haydovchi»: a new trip of a saved driver (docs/129, mockup g60/7)', () => {
  it('shows the trip once; «Band qilish» opens it ready to book', async () => {
    localStorage.clear();
    home();
    expect(await screen.findByText('Jasur yangi safar eʼlon qildi')).toBeTruthy();
    await tap('Band qilish');
    expect(screen.queryByText('Jasur yangi safar eʼlon qildi')).toBeNull();
    await sheetClosed();
  });

  it('«Keyinroq» does not ask about the same trip again', async () => {
    localStorage.clear();
    home();
    await tap('Keyinroq');
    await sheetClosed();
    cleanup();
    home();
    await screen.findAllByText(/Qayer/u);
    expect(screen.queryByText('Jasur yangi safar eʼlon qildi')).toBeNull();
  });

  it('does not offer a trip the passenger has a seat on already', async () => {
    localStorage.clear();
    home([{ ...confirmed, trip }]);
    await screen.findAllByText(/Jasur/u);
    expect(screen.queryByText('Jasur yangi safar eʼlon qildi')).toBeNull();
  });
});
