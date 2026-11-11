import { toCyrillic } from '@platform/i18n';
import { ApiError, type BookingsClient } from '@platform/api-client';
import type { ApiErrorCode, Border } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { takePoint, tap } from '../market/market-test-kit';
import { FARGONA_WHERE, openBook, row } from './book-flow-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

describe('«Qayerdan, qayerga?» (G59, docs/118 path 2, B)', { timeout: 20_000 }, () => {
  it('starts at the pitak, sends only with both points, then shows the waiting booking at once', async () => {
    const { book, onHome } = openBook('both');
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Qoʻyliq pitagi'))).toBeTruthy();
    // «Hammasi»: the seats times the share of one seat.
    expect(screen.getByText(/2 жой ×/)).toBeTruthy();
    await tap(toCyrillic('Soʻrov yuborish'));
    expect(book).not.toHaveBeenCalled();
    fireEvent.click(row(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await tap(toCyrillic('Soʻrov yuborish'));
    // No screen «Soʻrov yuborildi»: the booking with «Javob kutilmoqda» and the time of the answer.
    expect(await screen.findByText(toCyrillic('Javob kutilmoqda'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Soʻrov yuborildi'))).toBeNull();
    expect(book).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ mode: 'pitak', pickup: null, seats: 2 }),
    );
    await tap(toCyrillic('Bosh sahifa'));
    expect(onHome).toHaveBeenCalled();
  });

  // The last seat went while the person chose the points (G75, docs/158 А): the same route on.
  // G89 U2: a trip cancelled or changed meanwhile leads on the same way, with its reason.
  it.each<[ApiErrorCode, string]>([
    ['bookings.no_seats', 'Boʻsh joy qolmagan. Boshqa safarni tanlang.'],
    ['trips.wrong_status', 'Bu safar allaqachon oʻzgargan. Roʻyxatni yangilang.'],
  ])('offers «Oʻxshash safarlar» after %s', async (code, text) => {
    const book = vi.fn<BookingsClient['book']>(async () => {
      throw new ApiError(409, code);
    });
    const { onClose } = openBook('both', {}, book);
    fireEvent.click(row(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await tap(toCyrillic('Soʻrov yuborish'));
    expect(await screen.findByText(toCyrillic(text))).toBeTruthy();
    await tap(toCyrillic('Oʻxshash safarlar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the chosen points after a closed app (docs/94 F3, S1)', async () => {
    openBook('both');
    await screen.findByText(toCyrillic('Qayerdan, qayerga?'));
    fireEvent.click(row(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await screen.findByText(toCyrillic('Qayerdan, qayerga?'));
    cleanup();
    openBook('both');
    expect(await screen.findByText(toCyrillic('Oldingi yozganingiz tiklandi.'))).toBeTruthy();
    expect(screen.getAllByText(toCyrillic('Oʻzgartirish'))).toHaveLength(2);
  });

  it('keeps the pitak of a pitak-only trip: the start opens no map (G75, docs/158 Д)', async () => {
    openBook('pitak');
    expect(await screen.findByText(toCyrillic('Qoʻyliq pitagi'))).toBeTruthy();
    expect(row(toCyrillic('Olib ketish joyi'))).toBeNull();
    fireEvent.click(screen.getByText(toCyrillic('Qoʻyliq pitagi')));
    expect(screen.queryByText(toCyrillic('Qayerdan olib ketsin?'))).toBeNull();
    expect(screen.getByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
  });

  it('opens the map of the start at a door trip: «Uyim» and «Yaqin joylar» under it', async () => {
    openBook('door');
    expect(await screen.findByText(toCyrillic('Olib ketish joyi'))).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Qoʻyliq pitagi'))).toBeNull();
    fireEvent.click(row(toCyrillic('Olib ketish joyi')));
    expect(await screen.findByText(toCyrillic('Qayerdan olib ketsin?'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Uyim'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Yaqin joylar'))).toBeTruthy();
  });

  it('opens the map of the end right after the start while the end is not chosen (G78 П4)', async () => {
    openBook('door');
    fireEvent.click(await screen.findByText(toCyrillic('Olib ketish joyi')));
    await screen.findByText(toCyrillic('Qayerdan olib ketsin?'));
    await takePoint(toCyrillic('Chorsu bozori yaqinida'));
    expect(await screen.findByText(toCyrillic('Qayerda tushasiz?'))).toBeTruthy();
  });

  it('keeps the point inside the zone: a place outside it is not taken', async () => {
    openBook('door', { where: async () => FARGONA_WHERE });
    fireEvent.click(await screen.findByText(toCyrillic('Olib ketish joyi')));
    expect(
      await screen.findByText(toCyrillic('Bu joy Toshkent shahri hududida emas. Shu hududdan joy tanlang.')),
    ).toBeTruthy();
    await tap(toCyrillic('Shu yerdan olib ketsin'));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Qayerdan, qayerga?'))).toBeNull();
  });

  it('opens the map of a zone inside its border when the center of the place is outside it (G35)', async () => {
    const square: Border['parts'] = [
      [
        [
          [70, 40],
          [71, 40],
          [71, 41],
          [70, 41],
          [70, 40],
        ],
      ],
    ];
    const { map } = openBook('door', { border: async (id: string) => ({ id, parts: square }) });
    fireEvent.click(await screen.findByText(toCyrillic('Olib ketish joyi')));
    await waitFor(() => expect(map.at()).toEqual({ lat: 40.5, lng: 70.5 }));
  });
});
