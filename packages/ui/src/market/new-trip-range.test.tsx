import { DAY_MS, tashkentDate, tashkentDayStart } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chooseRoute, tap } from './market-test-kit';
import { openNewTrip } from './new-trip-test-kit';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const HOUR = 60 * 60 * 1000;

// G90 (docs/216, mockup g90 phone 4): the range on the one screen and in the trip that goes.
describe('NewTripFlow: a range of the departure', { timeout: 20_000 }, () => {
  it('shows «Ertaga, 08:00 dan 10:00 gacha» and publishes the start and the end', async () => {
    const { publishTrip } = openNewTrip();
    await chooseRoute();
    await tap(/^(Bugun|Ertaga), \d\d:\d\d$/u);
    await tap('Oraliqda');
    fireEvent.click(document.querySelectorAll('.week-day')[1] as HTMLElement);
    await tap('08:00');
    await tap('10:00');
    expect(await screen.findByText('Ertaga, 08:00 dan 10:00 gacha')).toBeTruthy();
    await tap('Eʼlon qilish');
    const day = tashkentDayStart(tashkentDate(Date.now() + DAY_MS));
    expect(publishTrip).toHaveBeenCalledWith(
      expect.objectContaining({ departAt: day + 8 * HOUR, departUntil: day + 10 * HOUR }),
    );
  });

  it('opens the sheet again on the range; an exact time takes its place', async () => {
    openNewTrip();
    await chooseRoute();
    await tap(/^(Bugun|Ertaga), \d\d:\d\d$/u);
    await tap('Oraliqda');
    fireEvent.click(document.querySelectorAll('.week-day')[1] as HTMLElement);
    await tap('08:00');
    await tap('11:00');
    await tap('Ertaga, 08:00 dan 11:00 gacha');
    expect(await screen.findByText('Qaysi soatdan? Toshkent vaqti bilan')).toBeTruthy();
    const ends = [...document.querySelectorAll('.time-cell[aria-pressed="true"]')].map((t) => t.textContent);
    expect(ends).toEqual(['08:00', '11:00']);
    await tap('Soat boshida');
    await tap('09:00');
    expect(await screen.findByText('Ertaga, 09:00')).toBeTruthy();
  });
});
