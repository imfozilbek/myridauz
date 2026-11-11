import { toCyrillic } from '@platform/i18n';
import { DAY_MS, tashkentDate, tashkentDayStart, type Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sheetClosed } from '../home/sheet-closed';
import { chooseRoute, tap } from './market-test-kit';
import { openNewTrip, seatsLess, seatsMore, tomorrowAtEight } from './new-trip-test-kit';

afterEach(cleanup);
// A draft of one test never opens the next one (docs/94 F3).
beforeEach(() => localStorage.clear());

const HOUR = 60 * 60 * 1000;
const WOMAN = toCyrillic('Mashinada ayol bor');
const seatsShown = () => screen.getAllByText(/^\d$/u)[0]?.textContent;

// G63 (docs/118 path 6, mockups g63/1, g63/2): the trip on one screen, its answers ready.
describe('NewTripFlow: a new trip on one screen', { timeout: 20_000 }, () => {
  it('shows the car, the route, all the seats, the price with its commission; publishes and opens the trip', async () => {
    const { publishTrip, tracked } = openNewTrip();
    await chooseRoute();
    expect(await screen.findByText(toCyrillic('Safar eʼlon qilish'))).toBeTruthy();
    expect(screen.getByText(`Cobalt, ${toCyrillic('Oq')} · 01 A 123 BC`)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Chilonzor, Toshkent shahri'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Fargʻona shahri'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('Mashinada 4 joy'))).toBeTruthy();
    expect(seatsShown()).toBe('4');
    expect((screen.getAllByLabelText(toCyrillic('Oshirish'))[0] as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/^Тавсия: 95\s000 · комиссия 9\s500$/u)).toBeTruthy();
    await tomorrowAtEight();
    await tap(toCyrillic('Eʼlon qilish'));
    const departAt = tashkentDayStart(tashkentDate(Date.now() + DAY_MS)) + 8 * HOUR;
    expect(publishTrip).toHaveBeenCalledWith({
      from: '1726269',
      to: '1730401',
      departAt,
      departUntil: null,
      seats: 4,
      price: 95000,
      womanOnBoard: false,
      comment: '',
      pickupMode: 'pitak',
      bookingRule: 'seats',
    });
    // «Mening safarim» of the new trip at once: no «Safar eʼlon qilindi» between (G63).
    await waitFor(() => expect(tracked.some((event) => event.screen === 'market.own_trip')).toBe(true));
    const steps = tracked.filter((event) => event.name === 'trip_step').map((event) => event.step);
    expect(steps).toEqual(['route', 'published']);
  });

  it('takes the seats down to one and up to the seats of the car; the price by the steps of the route', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    await screen.findByText(toCyrillic('Mashinada 4 joy'));
    for (let tap = 0; tap < 3; tap += 1) seatsLess();
    expect(seatsShown()).toBe('1');
    expect((screen.getAllByLabelText(toCyrillic('Kamaytirish'))[0] as HTMLButtonElement).disabled).toBe(true);
    seatsMore();
    fireEvent.click(screen.getAllByLabelText(toCyrillic('Oshirish'))[1] as HTMLElement);
    expect(screen.getByText(/^100\s000$/u)).toBeTruthy();
    expect(screen.getByText(/комиссия 10\s000$/u)).toBeTruthy();
    await tap(toCyrillic('Eʼlon qilish'));
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ seats: 2, price: 100000 }));
  });

  it('asks «Mashinada ayol bor» of a man only while he takes fewer people than his car has', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    await screen.findByText(toCyrillic('Mashinada 4 joy'));
    expect(screen.queryByText(WOMAN)).toBeNull();
    seatsLess();
    expect(screen.getByText(toCyrillic('Siz bilan ketayotgan odam ayolmi?'))).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: WOMAN }));
    // All the seats again: the row goes and its answer with it.
    seatsMore();
    expect(screen.queryByText(WOMAN)).toBeNull();
    seatsLess();
    expect((screen.getByRole('checkbox', { name: WOMAN }) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: WOMAN }));
    await tap(toCyrillic('Eʼlon qilish'));
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ seats: 3, womanOnBoard: true }));
  });

  it('never asks a woman driver: her mark is set by itself (docs/06)', async () => {
    openNewTrip({ gender: 'female' });
    await chooseRoute();
    await screen.findByText(toCyrillic('Mashinada 4 joy'));
    seatsLess();
    expect(seatsShown()).toBe('3');
    expect(screen.queryByText(WOMAN)).toBeNull();
  });

  it('takes «now» at the tap of «Eʼlon qilish»: a time that became too soon is chosen again (G77)', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    // A little after 17:00 in Tashkent: a trip leaves an hour later at the earliest (docs/103).
    expect(await screen.findByText(toCyrillic('Bugun, 18:30'))).toBeTruthy();
    vi.setSystemTime(Date.now() + 40 * 60 * 1000);
    await tap(toCyrillic('Eʼlon qilish'));
    // Never a time the person did not see: the day and the time open again, the screen caught up.
    await tap('19:00');
    expect(await screen.findByText(toCyrillic('Bugun, 19:00'))).toBeTruthy();
    expect(publishTrip).not.toHaveBeenCalled();
    await tap(toCyrillic('Eʼlon qilish'));
    const departAt = tashkentDayStart(tashkentDate(Date.now())) + 19 * HOUR;
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ departAt }));
    await sheetClosed();
  });

  it('publishes once when «Eʼlon qilish» is tapped twice while the first one runs (docs/65 A4)', async () => {
    const { publishTrip } = openNewTrip();
    publishTrip.mockImplementationOnce(() => new Promise<Trip>(() => undefined));
    await chooseRoute();
    const send = await screen.findByText(toCyrillic('Eʼlon qilish'));
    fireEvent.click(send);
    fireEvent.click(send);
    expect(publishTrip).toHaveBeenCalledTimes(1);
  });

  it('shows an error of the API and lets a driver on the check try everything but publishing', async () => {
    const { publishTrip } = openNewTrip();
    publishTrip.mockRejectedValueOnce(new Error('offline'));
    await chooseRoute();
    await tap(toCyrillic('Eʼlon qilish'));
    expect(await screen.findByText(toCyrillic('Birozdan keyin qayta urinib koʻring.'))).toBeTruthy();
    cleanup();
    localStorage.clear();
    const pending = openNewTrip({ status: 'pending' });
    await chooseRoute();
    expect(
      await screen.findByText(toCyrillic('Ariza tasdiqlangach safarni eʼlon qila olasiz.')),
    ).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Eʼlon qilish'))).toBeNull();
    expect(pending.publishTrip).not.toHaveBeenCalled();
  });
});
