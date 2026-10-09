import { BOOKING_LINK, MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { DriverHome } from '../home/driver-home';
import { DRIVER_ACTIONS, PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome } from '../home/home-test-kit';
import { sheetClosed } from '../home/sheet-closed';
import { PassengerHome } from '../home/passenger-home';
import { tap, trip } from '../market/market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const NOW = Date.parse('2026-10-01T05:00:00Z');
const OFFER_CHAT = 'o00000000-0000-4000-8000-0000000000d1';
const passenger = (bookings: (typeof confirmed)[]) => {
  vi.setSystemTime(NOW);
  return renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => bookings,
    sheet: true,
  });
};

// The answer of the other side over the main screen (G68, docs/122, mockup g68/7 screen 6).
describe('the sheet of an answer (G68)', () => {
  it('the driver confirmed the seat: «Joyingiz tasdiqlandi», «Safarni ochish» opens it', async () => {
    passenger([{ ...confirmed, id: 'a1', confirmedAt: NOW - 60_000 }]);
    expect(await screen.findByText('Joyingiz tasdiqlandi')).toBeTruthy();
    expect(screen.getByText('Jasur · 2 joy')).toBeTruthy();
    await tap('Safarni ochish');
    expect(await screen.findByText(`opened ${BOOKING_LINK}:a1`)).toBeTruthy();
    await sheetClosed();
  });

  it('«Yaxshi» puts it away for good; an old confirmation or the own offer asks nothing', async () => {
    passenger([{ ...confirmed, id: 'a2', confirmedAt: NOW - 60_000 }]);
    await tap('Yaxshi');
    await sheetClosed();
    expect(localStorage.getItem('sheet-answers-seen')).toContain('a2');
    cleanup();
    passenger([
      { ...confirmed, id: 'a2', confirmedAt: NOW - 60_000 },
      { ...confirmed, id: 'a3', confirmedAt: NOW - 2 * 24 * 3_600_000 },
      { ...confirmed, id: 'a4', confirmedAt: NOW - 60_000, chatKey: OFFER_CHAT },
    ]);
    await screen.findByText('Cobalt, Oq · 01 A 123 BC');
    expect(screen.queryByText('Joyingiz tasdiqlandi')).toBeNull();
  });

  it('the passenger took the offer of the driver: «Taklif qabul qilindi»', async () => {
    vi.setSystemTime(NOW);
    const taken = { ...confirmed, id: 'a5', confirmedAt: NOW - 60_000, chatKey: OFFER_CHAT };
    renderHome((go) => <DriverHome go={go} />, DRIVER_ACTIONS, {
      trips: async () => [trip],
      requests: async () => [taken],
      sheet: true,
    });
    expect(await screen.findByText('Taklif qabul qilindi')).toBeTruthy();
    expect(screen.getByText('Dilnoza · 2 joy')).toBeTruthy();
    expect(screen.getByText('Taklifingizga rozi boʻldi')).toBeTruthy();
    await tap('Safarni ochish');
    expect(await screen.findByText(`opened ${MY_TRIP_LINK}:t1`)).toBeTruthy();
    await sheetClosed();
  });
});
