import { toCyrillic } from '@platform/i18n';
import { ApiError, type BookingsClient } from '@platform/api-client';
import { BOOKING_LINK, MY_TRIP_LINK } from '@platform/contracts';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { FakeSocket } from '../chat/fake-socket';
import { sheetClosed } from '../home/sheet-closed';
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
    expect(await screen.findByText(toCyrillic('Yoʻlovchi'))).toBeTruthy();
    expect(screen.getByText('Dilnoza')).toBeTruthy();
    expect(screen.getByText('★ 4,8')).toBeTruthy();
    expect(screen.getByText(toCyrillic('Soʻrov: Chilonzor → Fargʻona, bugun'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 kishi · 95 000 · Uyidan yoki pitakdan'))).toBeTruthy();
  });

  it('has no ready answers about the meeting; the line about hidden numbers only after one', async () => {
    const { socket } = await openTalk({ about: [talk('driver')] });
    await screen.findByText(toCyrillic('Yoʻlovchi'));
    expect(screen.queryByText(toCyrillic('Yoʻldaman'))).toBeNull();
    expect(screen.queryByText(toCyrillic('Raqam va havolalar yashiriladi.'))).toBeNull();
    act(() => socket.receive({ type: 'warning' }));
    expect(await screen.findByText(toCyrillic('Raqam va havolalar yashiriladi.'))).toBeTruthy();
  });

  it('offers the live trip of the driver in one tap, then shows the offer that waits', async () => {
    const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
    const sent = talk('driver', { offer: { ...offer, tripId: 't1' } });
    await openTalk({
      about: [talk('driver'), sent],
      market: { requestBoard: async () => board({ trip, fits: [{ ...asked, extraKm: 2 }], others: [] }) },
      bookings: { sendOffer },
    });
    await tap(toCyrillic('Safarimga taklif qilish'));
    await waitFor(() =>
      expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: trip.departAt, price: 95000, tripId: 't1' }),
    );
    expect(await screen.findByText(toCyrillic('Siz taklif yubordingiz'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('bugun 08:00 · 2 joy'))).toBeTruthy();
    expect(screen.getByText(`Dilnoza ${toCyrillic('javobini kutyapsiz')}`)).toBeTruthy();
    // One offer at a time: the button goes while the offer waits (mockup g64/5 phone 3).
    expect(screen.queryByText(toCyrillic('Safarimga taklif qilish'))).toBeNull();
  });

  // G91 DRV-4: a live trip that the request does not fit: as on the board, a new offer waits until the
  // trip is over; no button the server refuses with «Eskisini bekor qiling».
  it('offers nothing while the driver has a live trip that the request does not fit', async () => {
    await openTalk({
      about: [talk('driver')],
      market: { requestBoard: async () => board({ trip, busy: true, fits: [], others: [asked] }) },
    });
    expect(await screen.findByText(toCyrillic('Yangi taklif shu safar tugagach'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Taklif yuborish'))).toBeNull();
  });

  // One way to offer a trip, as on the board (G77): counted, and a wallet short of the commission
  // opens the sheet of the sum short, not a line of error.
  it('counts the offer of the chat; a wallet short of the commission opens the sheet of the sum', async () => {
    const sendOffer = vi
      .fn<BookingsClient['sendOffer']>()
      .mockRejectedValueOnce(new ApiError(402, 'wallet.not_enough'))
      .mockResolvedValue(offer);
    const { tracked } = await openTalk({
      about: [talk('driver')],
      market: { requestBoard: async () => board({ trip, fits: [{ ...asked, extraKm: 2 }], others: [] }) },
      bookings: { sendOffer },
    });
    await tap(toCyrillic('Safarimga taklif qilish'));
    expect(await screen.findByText(toCyrillic('Hamyonda mablagʻ yetarli emas'))).toBeTruthy();
    expect(tracked.some((event) => 'step' in event && event.step === 'offer_sent')).toBe(false);
    await tap(toCyrillic('Safarimga taklif qilish'));
    await waitFor(() =>
      expect(tracked).toContainEqual(expect.objectContaining({ step: 'offer_sent', screen: 'chat' })),
    );
  });

  it('opens the trip from a whole car request in the chat when the driver has none', async () => {
    const offerSalonTrip = vi.fn<BookingsClient['offerSalonTrip']>(async () => ({ trip, offer }));
    const onLink = vi.fn();
    await openTalk({ about: [talk('driver', { request: salon })], bookings: { offerSalonTrip }, onLink });
    await tap(toCyrillic('Safar ochib taklif qilish'));
    expect(await screen.findByText(`Dilnoza ${toCyrillic('uchun safar')}`)).toBeTruthy();
    // As from the board (G77): the trip opened for the passenger opens «Mening safarim».
    fireEvent.click(
      await within(await screen.findByRole('dialog')).findByRole('button', {
        name: toCyrillic('Safar ochib taklif qilish'),
      }),
    );
    await waitFor(() => expect(onLink).toHaveBeenCalledWith({ name: MY_TRIP_LINK, id: trip.id }));
    await sheetClosed();
  });

  it('shows the passenger the driver with the car and lets them take the offer right here', async () => {
    const answerOffer = vi.fn<BookingsClient['answerOffer']>(async () => ({
      ...offer,
      status: 'accepted',
      bookingId: 'b1',
    }));
    const onLink = vi.fn();
    const { tracked } = await openTalk({
      about: [talk('passenger', { request: salon, offer: salonOffer })],
      bookings: { answerOffer },
      onLink,
    });
    expect(await screen.findByText(toCyrillic('Soʻrovingiz: Chilonzor → Fargʻona, bugun'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 kishi · Boʻsh salon kerak'))).toBeTruthy();
    expect(screen.getByText(`Jasur ${toCyrillic('taklif yubordi')}`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('bugun 08:00 · butun salon'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('4 joy × 90 000'))).toBeTruthy();
    expect(screen.getAllByRole('img', { name: '01 A 123 BC' }).length).toBe(2);
    await tap(toCyrillic('Qabul qilish'));
    await waitFor(() => expect(answerOffer).toHaveBeenCalledWith('o1', 'accept'));
    // One answer everywhere (G77): the funnel counts the offer taken in the chat too.
    expect(tracked).toContainEqual(expect.objectContaining({ step: 'offer_accepted', screen: 'chat' }));
    // The seat of the taken offer opens, as from the sheet and «Mening soʻrovim» (G77).
    await waitFor(() => expect(onLink).toHaveBeenCalledWith({ name: BOOKING_LINK, id: 'b1' }));
  });

  it('says why a ring did not go: the passenger turned calls off', async () => {
    const { socket } = await openTalk({ about: [talk('driver')] });
    act(() => socket.receive({ type: 'callRefused', reason: 'off' }));
    expect(
      await screen.findByText(toCyrillic('Yoʻlovchi qoʻngʻiroqlarni oʻchirgan. Chatda yozing.')),
    ).toBeTruthy();
    expect(within(document.body).queryByRole('dialog')).toBeNull();
  });
});
