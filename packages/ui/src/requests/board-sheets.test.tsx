import { toCyrillic } from '@platform/i18n';
import { ApiError, type BookingsClient } from '@platform/api-client';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offer } from '../bookings/booking-test-kit';
import { sheetClosed } from '../home/sheet-closed';
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
      await tap(toCyrillic('Taklif yuborish'));
      const form = await sheet();
      expect(form.getByText(`Dilnozaga ${toCyrillic('taklif')}`)).toBeTruthy();
      expect(form.getByText(toCyrillic('Chilonzor → Fargʻona · bugun · 2 kishi'))).toBeTruthy();
      expect(form.getByText(`Dilnoza ${toCyrillic('taklifi: 95 000')}`)).toBeTruthy();
      expect(form.getByRole('radio', { name: '08:00' }).getAttribute('aria-checked')).toBe('true');
      fireEvent.click(form.getByRole('radio', { name: '10:00' }));
      fireEvent.click(form.getByLabelText(toCyrillic('Oshirish')));
      expect(form.getByText('100 000')).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: toCyrillic('Taklif yuborish') }));
      await waitFor(() => expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: TEN, price: 100000 }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('takes «now» at the tap: a time that became too soon on the open sheet is chosen again (G77)', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
      openBoard({ bookings: { sendOffer } });
      await tap(toCyrillic('Taklif yuborish'));
      const form = await sheet();
      expect(form.getByRole('radio', { name: '08:00' }).getAttribute('aria-checked')).toBe('true');
      // 07:10 in Tashkent: 08:00 is less than an hour away (docs/103). Never a time not seen: the
      // sheet says why and shows the next time; the next tap sends it.
      vi.setSystemTime(NOW + 70 * 60_000);
      fireEvent.click(await form.findByRole('button', { name: toCyrillic('Taklif yuborish') }));
      expect(await form.findByText(toCyrillic('Bu vaqt juda yaqin. Keyinroq vaqtni tanlang.'))).toBeTruthy();
      expect(sendOffer).not.toHaveBeenCalled();
      expect(form.getByRole('radio', { name: '10:00' }).getAttribute('aria-checked')).toBe('true');
      fireEvent.click(form.getByRole('button', { name: toCyrillic('Taklif yuborish') }));
      await waitFor(() => expect(sendOffer).toHaveBeenCalledWith('r1', { departAt: TEN, price: 95000 }));
      await sheetClosed();
    });

    // Telegram «Назад» closes only the sheet: the board stays, the offer typed comes back (G77).
    it('«Назад» closes the sheet on the board; it opens again with the time and the price typed', async () => {
      openBoard({ inTelegram: true });
      await tap(toCyrillic('Taklif yuborish'));
      const form = await sheet();
      fireEvent.click(form.getByRole('radio', { name: '10:00' }));
      fireEvent.click(form.getByLabelText(toCyrillic('Oshirish')));
      act(pressBack);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByText(toCyrillic('Yoʻlovchilar soʻrovlari'))).toBeTruthy();
      await tap(toCyrillic('Taklif yuborish'));
      const again = await sheet();
      expect(again.getByRole('radio', { name: '10:00' }).getAttribute('aria-checked')).toBe('true');
      expect(again.getByText('100 000')).toBeTruthy();
    });

    it('«Boshqa» takes any free time of the day from the native list', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => offer);
      openBoard({ bookings: { sendOffer } });
      await tap(toCyrillic('Taklif yuborish'));
      const form = await sheet();
      fireEvent.change(form.getByLabelText(toCyrillic('Boshqa')), { target: { value: '15:30' } });
      expect(form.getByText('15:30', { selector: 'label' })).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: toCyrillic('Taklif yuborish') }));
      await waitFor(() => expect(sendOffer.mock.calls[0]?.[1].departAt).toBe(EIGHT + 7.5 * 3_600_000));
    });

    it('a wallet with less than the commission leads to the top up, not to an error', async () => {
      const sendOffer = vi.fn<BookingsClient['sendOffer']>(async () => {
        throw new ApiError(402, 'wallet.not_enough');
      });
      openBoard({ bookings: { sendOffer } });
      await tap(toCyrillic('Taklif yuborish'));
      fireEvent.click(await (await sheet()).findByRole('button', { name: toCyrillic('Taklif yuborish') }));
      expect(await screen.findByText(toCyrillic('Hamyonda mablagʻ yetarli emas'))).toBeTruthy();
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
      expect(await screen.findByText(toCyrillic('Boʻsh salon kerak'))).toBeTruthy();
      await tap(toCyrillic('Safar ochib taklif qilish'));
      const form = await sheet();
      expect(form.getByText(`Dilnoza ${toCyrillic('uchun safar')}`)).toBeTruthy();
      expect(form.getByText(toCyrillic('Bugun'))).toBeTruthy();
      expect(form.getByText(toCyrillic('Qoʻyliq pitagi'))).toBeTruthy();
      expect(form.getByText(toCyrillic('Faqat butun salon'))).toBeTruthy();
      // Every seat of the car at the price of the request (G61).
      expect(form.getByText(toCyrillic('6 joy × 95 000 = 570 000'))).toBeTruthy();
      // The commission of the whole car before the offer goes (G75, docs/158 Г).
      expect(form.getByText(/^Комиссия · 57.000 сўм$/u)).toBeTruthy();
      expect(form.getByText(`Dilnoza ${toCyrillic('rozi boʻlsa, safar unga band boʻladi')}.`)).toBeTruthy();
      fireEvent.click(await form.findByRole('button', { name: toCyrillic('Safar ochib taklif qilish') }));
      await waitFor(() => expect(offerSalonTrip).toHaveBeenCalledWith('r2', EIGHT));
    });
  },
);
