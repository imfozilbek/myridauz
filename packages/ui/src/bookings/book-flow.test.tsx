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
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    expect(screen.getByText('Qoʻyliq pitagi')).toBeTruthy();
    // «Hammasi»: the seats times the share of one seat.
    expect(screen.getByText(/2 joy ×/)).toBeTruthy();
    await tap('Soʻrov yuborish');
    expect(book).not.toHaveBeenCalled();
    fireEvent.click(row('Tushirish joyi'));
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await tap('Soʻrov yuborish');
    // No screen «Soʻrov yuborildi»: the booking with «Javob kutilmoqda» and the time of the answer.
    expect(await screen.findByText('Javob kutilmoqda')).toBeTruthy();
    expect(screen.queryByText('Soʻrov yuborildi')).toBeNull();
    expect(book).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ mode: 'pitak', pickup: null, seats: 2 }),
    );
    await tap('Bosh sahifa');
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
    fireEvent.click(row('Tushirish joyi'));
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await tap('Soʻrov yuborish');
    expect(await screen.findByText(text)).toBeTruthy();
    await tap('Oʻxshash safarlar');
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the chosen points after a closed app (docs/94 F3, S1)', async () => {
    openBook('both');
    await screen.findByText('Qayerdan, qayerga?');
    fireEvent.click(row('Tushirish joyi'));
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await screen.findByText('Qayerdan, qayerga?');
    cleanup();
    openBook('both');
    expect(await screen.findByText('Oldingi yozganingiz tiklandi.')).toBeTruthy();
    expect(screen.getAllByText('Oʻzgartirish')).toHaveLength(2);
  });

  it('keeps the pitak of a pitak-only trip: the start opens no map (G75, docs/158 Д)', async () => {
    openBook('pitak');
    expect(await screen.findByText('Qoʻyliq pitagi')).toBeTruthy();
    expect(row('Olib ketish joyi')).toBeNull();
    fireEvent.click(screen.getByText('Qoʻyliq pitagi'));
    expect(screen.queryByText('Qayerdan olib ketsin?')).toBeNull();
    expect(screen.getByText('Qayerdan, qayerga?')).toBeTruthy();
  });

  it('opens the map of the start at a door trip: «Uyim» and «Yaqin joylar» under it', async () => {
    openBook('door');
    expect(await screen.findByText('Olib ketish joyi')).toBeTruthy();
    expect(screen.queryByText('Qoʻyliq pitagi')).toBeNull();
    fireEvent.click(row('Olib ketish joyi'));
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.getByText('Uyim')).toBeTruthy();
    expect(screen.getByText('Yaqin joylar')).toBeTruthy();
  });

  it('opens the map of the end right after the start while the end is not chosen (G78 П4)', async () => {
    openBook('door');
    fireEvent.click(await screen.findByText('Olib ketish joyi'));
    await screen.findByText('Qayerdan olib ketsin?');
    await takePoint('Chorsu bozori yaqinida');
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
  });

  it('keeps the point inside the zone: a place outside it is not taken', async () => {
    openBook('door', { where: async () => FARGONA_WHERE });
    fireEvent.click(await screen.findByText('Olib ketish joyi'));
    expect(
      await screen.findByText('Bu joy Toshkent shahri hududida emas. Shu hududdan joy tanlang.'),
    ).toBeTruthy();
    await tap('Shu yerdan olib ketsin');
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Qayerdan, qayerga?')).toBeNull();
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
    fireEvent.click(await screen.findByText('Olib ketish joyi'));
    await waitFor(() => expect(map.at()).toEqual({ lat: 40.5, lng: 70.5 }));
  });
});
