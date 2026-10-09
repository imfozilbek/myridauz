import type { BookingsClient } from '@platform/api-client';
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { FakeSocket } from '../chat/fake-socket';
import { tap, trip } from '../market/market-test-kit';
import { asked, board, NOW, salon } from '../requests/board-test-kit';
import { openTalk, salonOffer, talk } from './talk-test-kit';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  vi.stubGlobal('WebSocket', FakeSocket);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('the chat before a booking (G64, mockups g64/4, g64/5)', { timeout: 20_000 }, () => {
  it('shows the driver the passenger with the rating and the request on top', async () => {
    await openTalk({ about: [talk('driver')] });
    expect(await screen.findByText('Yoʻlovchi')).toBeTruthy();
    expect(screen.getByText('Dilnoza')).toBeTruthy();
    expect(screen.getByText('★ 4,8')).toBeTruthy();
    expect(screen.getByText('Soʻrov: Chilonzor → Fargʻona, bugun')).toBeTruthy();
    expect(screen.getByText('2 kishi · 95 000 · Uyidan yoki pitakdan')).toBeTruthy();
  });

  it('has no ready answers about the meeting; the line about hidden numbers only after one', async () => {
    const { socket } = await openTalk({ about: [talk('driver')] });
    await screen.findByText('Yoʻlovchi');
    expect(screen.queryByText('Yoʻldaman')).toBeNull();
    expect(screen.queryByText('Raqam va havolalar yashiriladi.')).toBeNull();
    act(() => socket.receive({ type: 'warning' }));
    expect(await screen.findByText('Raqam va havolalar yashiriladi.')).toBeTruthy();
  });

  it('offers the live trip of the driver in one tap, then shows the offer that waits', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    const sent = talk('driver', { offer: { ...offer, tripId: 't1' } });
    await openTalk({
      about: [talk('driver'), sent],
      market: { requestBoard: async () => board({ trip, fits: [{ ...asked, extraKm: 2 }], others: [] }) },
      bookings: { sendOffer },
    });
    await tap('Safarimga taklif qilish');
    await waitFor(() =>
      expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: trip.departAt, price: 95000, tripId: 't1' }),
    );
    expect(await screen.findByText('Siz taklif yubordingiz')).toBeTruthy();
    expect(screen.getByText('bugun 08:00 · 2 joy')).toBeTruthy();
    expect(screen.getByText('Dilnoza javobini kutyapsiz')).toBeTruthy();
    // One offer at a time: the button goes while the offer waits (mockup g64/5 phone 3).
    expect(screen.queryByText('Safarimga taklif qilish')).toBeNull();
  });

  it('opens the trip from a whole car request in the chat when the driver has none', async () => {
    await openTalk({ about: [talk('driver', { request: salon })] });
    await tap('Safar ochib taklif qilish');
    expect(await screen.findByText('Dilnoza uchun safar')).toBeTruthy();
  });

  it('shows the passenger the driver with the car and lets them take the offer right here', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    await openTalk({
      about: [talk('passenger', { request: salon, offer: salonOffer })],
      bookings: { answerOffer },
    });
    expect(await screen.findByText('Soʻrovingiz: Chilonzor → Fargʻona, bugun')).toBeTruthy();
    expect(screen.getByText('2 kishi · Boʻsh salon kerak')).toBeTruthy();
    expect(screen.getByText('Jasur taklif yubordi')).toBeTruthy();
    expect(screen.getByText('bugun 08:00 · butun salon')).toBeTruthy();
    expect(screen.getByText('4 joy × 90 000')).toBeTruthy();
    expect(screen.getAllByRole('img', { name: '01 A 123 BC' }).length).toBe(2);
    await tap('Qabul qilish');
    await waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'accept'));
  });

  it('says why a ring did not go: the passenger turned calls off', async () => {
    const { socket } = await openTalk({ about: [talk('driver')] });
    act(() => socket.receive({ type: 'callRefused', reason: 'off' }));
    expect(await screen.findByText('Yoʻlovchi qoʻngʻiroqlarni oʻchirgan. Chatda yozing.')).toBeTruthy();
    expect(within(document.body).queryByRole('dialog')).toBeNull();
  });
});
