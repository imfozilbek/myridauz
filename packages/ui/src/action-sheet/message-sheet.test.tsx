import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome, sheetClosed } from '../home/home-test-kit';
import { PassengerHome } from '../home/passenger-home';
import { tap } from '../market/market-test-kit';

afterEach(cleanup);

const NOW = Date.parse('2026-10-01T05:00:00Z');
const WORDS = 'Uydan olib ketaman, 07:50 da Grand oldida boʻlaman.';

function passenger(key: string) {
  vi.setSystemTime(NOW);
  const answer = vi.fn(async () => undefined);
  const openChat = vi.fn();
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, {
    bookings: async () => [confirmed],
    sheet: true,
    openChat,
    chat: {
      unread: async () => [{ key, count: 1, text: WORDS, at: NOW }],
      about: async () => ({
        booking: confirmed,
        role: 'passenger',
        request: null,
        offer: null,
        driver: null,
      }),
      answer,
    },
  });
  return { answer, openChat };
}

// «Yangi xabar» over the main screen (G68, docs/122, mockup g68/8 «Xabar»): the words, ready answers.
describe('the sheet of a new message (G68)', () => {
  it('shows who wrote, about which trip and the words', async () => {
    passenger('b00000000-0000-4000-8000-000000000a01');
    expect(await screen.findByText('Yangi xabar')).toBeTruthy();
    expect(screen.getAllByText('Jasur').length).toBeGreaterThan(0);
    expect(screen.getByText('Ertaga 08:00 · Fargʻonaga')).toBeTruthy();
    expect(screen.getByText(`«${WORDS}»`)).toBeTruthy();
    await tap('Keyinroq');
    await sheetClosed();
  });

  it('a ready answer goes in one tap without opening the chat', async () => {
    const key = 'b00000000-0000-4000-8000-000000000a02';
    const { answer } = passenger(key);
    await tap('Kutaman');
    expect(answer).toHaveBeenCalledWith(key, 'Kutaman');
    expect(await screen.findByText('Javob yuborildi')).toBeTruthy();
    await sheetClosed();
  });

  it('«Javob yozish» opens the chat', async () => {
    const key = 'b00000000-0000-4000-8000-000000000a03';
    const { openChat } = passenger(key);
    await tap('Javob yozish');
    expect(openChat).toHaveBeenCalledWith(key);
    await sheetClosed();
  });
});
