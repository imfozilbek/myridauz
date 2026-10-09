import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { DriverHome } from '../home/driver-home';
import { DRIVER_ACTIONS, PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome, sheetClosed } from '../home/home-test-kit';
import { PassengerHome } from '../home/passenger-home';
import { tap, trip } from '../market/market-test-kit';

afterEach(cleanup);

// Ten minutes before the departure: the meeting is open (docs/126).
const NOW = confirmed.trip.departAt - 10 * 60_000;
// Confirmed long ago: no «Joyingiz tasdiqlandi» after the meeting.
const old = { ...confirmed, confirmedAt: NOW - 3 * 24 * 3_600_000 };
const lastButton = (name: string) =>
  fireEvent.click(screen.getAllByRole('button', { name }).at(-1) as Element);

function passenger(id: string) {
  vi.setSystemTime(NOW);
  const came = vi.fn(async () => ({ ...confirmed, id, cameAt: NOW }));
  const answer = vi.fn(async () => undefined);
  const openChat = vi.fn();
  const booking = { ...old, id, driverCameAt: NOW - 60_000 };
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => [booking],
    sheet: true,
    openChat,
    chat: { came, answer },
  });
  return { came, answer, openChat, booking };
}

// «Uchrashuv» over the main screen (G68, docs/122, mockup g68/8 «Uchrashuv»).
describe('the sheet of the meeting (G68)', () => {
  it('the driver came: the car with its plate, «Men keldim» tells the driver in one tap', async () => {
    const { came } = passenger('m1');
    expect(await screen.findByText('Uchrashuv')).toBeTruthy();
    expect(screen.getByText('Jasur keldi')).toBeTruthy();
    expect(screen.getByText('Chilonzor bozori yaqinida kutmoqda')).toBeTruthy();
    expect(screen.getByText('Oq Chevrolet Cobalt')).toBeTruthy();
    lastButton('Men keldim');
    await vi.waitFor(() => expect(came).toHaveBeenCalledWith('m1'));
    expect(await screen.findByText('Haydovchiga aytildi')).toBeTruthy();
    await sheetClosed();
  });

  it('«5 daqiqada» writes it to the driver; «Qoʻngʻiroq» opens the chat and rings', async () => {
    const { answer, openChat, booking } = passenger('m2');
    await tap('5 daqiqada');
    expect(answer).toHaveBeenCalledWith(booking.chatKey, '5 daqiqada chiqaman');
    await sheetClosed();
    cleanup();
    const second = passenger('m3');
    await tap('Qoʻngʻiroq');
    expect(second.openChat).toHaveBeenCalledWith(second.booking.chatKey, 'ring');
    expect(openChat).not.toHaveBeenCalled();
    await sheetClosed();
  });

  it('the passenger came: the driver says «Men keldim» or «10 daqiqada»', async () => {
    vi.setSystemTime(NOW);
    const meet = vi.fn(async () => confirmed);
    const answer = vi.fn(async () => undefined);
    const waiting = { ...old, id: 'm4', cameAt: NOW - 60_000 };
    renderHome((go) => <DriverHome go={go} />, DRIVER_ACTIONS, {
      trips: async () => [trip],
      requests: async () => [waiting],
      sheet: true,
      answers: { meet },
      chat: { answer },
    });
    expect(await screen.findByText('Dilnoza keldi')).toBeTruthy();
    await tap('10 daqiqada');
    expect(answer).toHaveBeenCalledWith(waiting.chatKey, '10 daqiqada yetib boraman');
    await sheetClosed();
  });
});
