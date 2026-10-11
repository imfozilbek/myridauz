import { ApiError, type BookingsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { tap, trip } from '../market/market-test-kit';
import { pressBack } from '../test-native';
import { board, EIGHT, NOW, openBoard, salon, TEN } from './board-test-kit';

vi.mock('@telegram-apps/sdk-react', async (original) => ({
  ...(await original<object>()),
  ...(await import('../test-native')).nativeButtons,
}));

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const sheet = async () => within(await screen.findByRole('dialog'));

describe(
  '«Taklif yuborish»: one sheet with the time and the price (mockup g64/1 phone 3)',
  { timeout: 20_000 },
  () => {
    it('chooses the first time, starts the price from the passenger and moves it by the step', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
      openBoard({ bookings: { sendOffer } });
      await tap('Taklif yuborish');
      const form = await sheet();
      expect(form.getByText('Dilnozaga taklif')).toBeTruthy();
      expect(form.getByText('Chilonzor → Fargʻona · bugun · 2 kishi')).toBeTruthy();
      expect(form.getByText('Dilnoza taklifi: 95 000')).toBeTruthy();
      expect(form.getByRole('radio', { name: '08:00' }).getAttribute('aria-checked')).toBe('true');
      fireEvent.click(form.getByRole('radio', { name: '10:00' }));
      fireEvent.click(form.getByLabelText('Oshirish'));
      expect(form.getByText('100 000')).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: 'Taklif yuborish' }));
      await waitFor(() => expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: TEN, price: 100000 }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    // Telegram «Назад» closes only the sheet: the board stays, the offer typed comes back (G77).
    it('«Назад» closes the sheet on the board; it opens again with the time and the price typed', async () => {
      openBoard({ inTelegram: true });
      await tap('Taklif yuborish');
      const form = await sheet();
      fireEvent.click(form.getByRole('radio', { name: '10:00' }));
      fireEvent.click(form.getByLabelText('Oshirish'));
      act(pressBack);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByText('Yoʻlovchilar soʻrovlari')).toBeTruthy();
      await tap('Taklif yuborish');
      const again = await sheet();
      expect(again.getByRole('radio', { name: '10:00' }).getAttribute('aria-checked')).toBe('true');
      expect(again.getByText('100 000')).toBeTruthy();
    });

    it('«Boshqa» takes any free time of the day from the native list', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
      openBoard({ bookings: { sendOffer } });
      await tap('Taklif yuborish');
      const form = await sheet();
      fireEvent.change(form.getByLabelText('Boshqa'), { target: { value: '15:30' } });
      expect(form.getByText('15:30', { selector: 'label' })).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: 'Taklif yuborish' }));
      await waitFor(() => expect(sendOffer.mock.calls[0]?.[1].departAt).toBe(EIGHT + 7.5 * 3_600_000));
    });

    it('a wallet with less than the commission leads to the top up, not to an error', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => {
        throw new ApiError(402, 'wallet.not_enough');
      });
      openBoard({ bookings: { sendOffer } });
      await tap('Taklif yuborish');
      fireEvent.click(await (await sheet()).findByRole('button', { name: 'Taklif yuborish' }));
      expect(await screen.findByText('Hamyonda mablagʻ yetarli emas')).toBeTruthy();
    });
  },
);

describe(
  '«Safar ochib taklif qilish»: a trip from a «Boʻsh salon kerak» request (mockup g64/3)',
  { timeout: 20_000 },
  () => {
    it('fills the sheet from the request and opens the trip for this passenger with the time chosen', async () => {
      const offerSalonTrip = vi.fn<BookingsClient['offerSalonTrip']>(async () => ({ trip, offer }));
      // The board says the seats of the car: a bot link opens the board without the driver's data.
      openBoard({
        requestBoard: async () => board({ others: [salon], carSeats: 6 }),
        bookings: { offerSalonTrip },
      });
      expect(await screen.findByText('Boʻsh salon kerak')).toBeTruthy();
      await tap('Safar ochib taklif qilish');
      const form = await sheet();
      expect(form.getByText('Dilnoza uchun safar')).toBeTruthy();
      expect(form.getByText('Bugun')).toBeTruthy();
      expect(form.getByText('Qoʻyliq pitagi')).toBeTruthy();
      expect(form.getByText('Faqat butun salon')).toBeTruthy();
      // Every seat of the car at the price of the request (G61).
      expect(form.getByText('6 joy × 95 000 = 570 000')).toBeTruthy();
      // The commission of the whole car before the offer goes (G75, docs/158 Г).
      expect(form.getByText(/^Komissiya · 57.000 soʻm$/u)).toBeTruthy();
      expect(form.getByText('Dilnoza rozi boʻlsa, safar unga band boʻladi.')).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: 'Safar ochib taklif qilish' }));
      await waitFor(() => expect(offerSalonTrip).toHaveBeenCalledWith('r2', EIGHT));
    });
  },
);
