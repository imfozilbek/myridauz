import { toCyrillic } from '@platform/i18n';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, ROUTE, takePoint, tap } from './market-test-kit';
import { openRequest } from './request-test-kit';
import { pickDay } from '../days/week-test-kit';

const RESTORED = toCyrillic('Oldingi yozganingiz tiklandi.');
afterEach(cleanup);
beforeEach(() => localStorage.clear());

// From the main screen to the map of the end: the route, tomorrow, the start chosen on its map; the
// map of the end opens at once (G78 П4).
async function toEndMap() {
  await quickRoute();
  await pickDay(1);
  fireEvent.click(await screen.findByText(toCyrillic('Olib ketish joyi')));
  await takePoint(toCyrillic('Chorsu bozori yaqinida'));
  await screen.findByText(toCyrillic('Qayerda tushasiz?'));
}

describe('NewRequestFlow keeps its answers (docs/94 F3, F8, F9)', { timeout: 20_000 }, () => {
  it('«Назад» from a map comes back to the screen with the chosen point; from it to the day', async () => {
    openRequest();
    await toEndMap();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Chorsu bozori yaqinida'))).toBeTruthy();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Qaysi kuni?'))).toBeTruthy();
    expect(document.querySelectorAll('.week-day')[1]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('a closed app opens the same screen; sent, the draft is gone', async () => {
    openRequest();
    await toEndMap();
    await tap(toCyrillic('Orqaga'));
    fireEvent.click(
      (await screen.findAllByRole('button', { name: toCyrillic('Oshirish') }))[0] as HTMLElement,
    );
    cleanup();
    const publishRequest = openRequest();
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    expect(screen.getByText(RESTORED)).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Tushirish joyi')));
    await takePoint(toCyrillic('Yangi Margʻilon'));
    await tap(toCyrillic('Soʻrov qoldirish'));
    expect(await screen.findByText(toCyrillic('Soʻrovni bekor qilish'))).toBeTruthy();
    expect(publishRequest).toHaveBeenCalledWith(expect.objectContaining({ seats: 2, price: 95000 }));
    cleanup();
    openRequest();
    await quickRoute();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('both ends of the block: the day is asked at once, the route is not asked again (G76)', async () => {
    openRequest({ ends: ROUTE });
    expect(await screen.findByText(toCyrillic('Qaysi kuni?'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: toCyrillic('Davom etish') })).toBeNull();
    await tap(toCyrillic('Orqaga'));
    expect(await screen.findByText(toCyrillic('Chilonzor'))).toBeTruthy();
  });

  it('F9: the sent request has «Назад» to the main screen', async () => {
    const home = vi.fn();
    openRequest({ onBack: home });
    await toEndMap();
    await takePoint(toCyrillic('Yangi Margʻilon'));
    await tap(toCyrillic('Soʻrov qoldirish'));
    await screen.findByText(toCyrillic('Soʻrovni bekor qilish'));
    await tap(toCyrillic('Orqaga'));
    expect(home).toHaveBeenCalledOnce();
  });
});
