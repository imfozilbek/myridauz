import { MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { DriverHome } from '../home/driver-home';
import { DRIVER_ACTIONS } from '../home/home-test-actions';
import { renderHome, sheetClosed } from '../home/home-test-kit';
import { tap, trip } from '../market/market-test-kit';

afterEach(cleanup);

// 10:00 the day before the trip of 08:00 in Toshkent.
const NOW = Date.parse('2026-10-01T05:00:00Z');
const asked = {
  ...booking,
  passenger: { ...booking.passenger, firstName: 'Madina', rating: { average: 4.8, count: 12 } },
  expiresAt: NOW + 29.5 * MINUTE_MS,
};

function driver(requests = [asked], answer = vi.fn(async () => asked)) {
  vi.setSystemTime(NOW);
  const shown = renderHome((go) => <DriverHome go={go} />, DRIVER_ACTIONS, {
    trips: async () => [trip],
    requests: async () => requests,
    sheet: true,
    answers: { answer },
  });
  return { ...shown, answer };
}

// «Yangi soʻrov» over the main screen of a driver (G68, docs/122, mockup g68/7 screen 3).
describe('the sheet of a new request (G68)', () => {
  it('says who, how many seats, when and where, the sum, the commission and the time to answer', async () => {
    driver();
    expect(await screen.findByText('Yangi soʻrov')).toBeTruthy();
    expect(screen.getByText('Madina · 2 joy')).toBeTruthy();
    expect(screen.getByText('★ 4,8 · 12 safar')).toBeTruthy();
    expect(screen.getByText('Ertaga 08:00 · Chilonzor → Fargʻona')).toBeTruthy();
    expect(screen.getByText('Olib ketish')).toBeTruthy();
    expect(screen.getByText('Qatortol atrofi')).toBeTruthy();
    expect(screen.getByText(/^2 joy × 95.000$/u)).toBeTruthy();
    expect(screen.getByText(/^190.000$/u)).toBeTruthy();
    expect(screen.getByText('Komissiya, safar boʻlmasa qaytadi')).toBeTruthy();
    expect(screen.getByText(/^19.000$/u)).toBeTruthy();
    expect(screen.getByText('Javob berish uchun 29 daqiqa')).toBeTruthy();
    await tap('Keyinroq');
    await sheetClosed();
  });

  // «Keyinroq» lasts the session of the Mini App: each test has its own requests.
  it('«Tasdiqlash» answers in one tap; the plaque on top says the commission', async () => {
    const { answer } = driver([{ ...asked, id: 'b3' }]);
    await tap('Tasdiqlash');
    expect(answer).toHaveBeenCalledWith('b3', 'confirm');
    expect(await screen.findByText(/^Madina tasdiqlandi · 19.000 komissiya$/u)).toBeTruthy();
    await sheetClosed();
  });

  it('«Rad etish» declines; two requests show «1 / 2», then the next one', async () => {
    const olim = { ...asked, id: 'b5', passenger: { ...asked.passenger, firstName: 'Olim' } };
    const { answer } = driver([{ ...asked, id: 'b4' }, olim]);
    expect(await screen.findByText('1 / 2')).toBeTruthy();
    await tap('Rad etish');
    expect(answer).toHaveBeenCalledWith('b4', 'decline');
    expect(await screen.findByText('Olim · 2 joy')).toBeTruthy();
    expect(screen.getByText('2 / 2')).toBeTruthy();
    await tap('Keyinroq');
    await sheetClosed();
  });
});
