import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, takePoint, tap } from './market-test-kit';
import { openRequest } from './request-test-kit';

const RESTORED = 'Oldingi yozganingiz tiklandi.';
afterEach(cleanup);
beforeEach(() => localStorage.clear());

// From the main screen to «Qayerdan, qayerga?»: the route, tomorrow, the start chosen on its map.
async function toPoints() {
  await quickRoute();
  await tap(/^Ertaga/);
  fireEvent.click(await screen.findByText('Olib ketish joyi'));
  await takePoint('Chorsu bozori yaqinida');
  await screen.findByText('Qayerdan, qayerga?');
}

describe('NewRequestFlow keeps its answers (docs/94 F3, F8, F9)', { timeout: 20_000 }, () => {
  it('«Назад» from a map comes back to the screen with the chosen point; from it to the day', async () => {
    openRequest();
    await toPoints();
    fireEvent.click(screen.getByText('Tushirish joyi'));
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Chorsu bozori yaqinida')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText(/^Ertaga/)).toBeTruthy();
  });

  it('a closed app opens the same screen; sent, the draft is gone', async () => {
    openRequest();
    await toPoints();
    fireEvent.click(screen.getAllByRole('button', { name: 'Oshirish' })[0] as HTMLElement);
    cleanup();
    const publishRequest = openRequest();
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    expect(screen.getByText(RESTORED)).toBeTruthy();
    fireEvent.click(screen.getByText('Tushirish joyi'));
    await takePoint('Yangi Margʻilon');
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrov qoldirildi')).toBeTruthy();
    expect(publishRequest).toHaveBeenCalledWith(expect.objectContaining({ seats: 2, price: 95000 }));
    cleanup();
    openRequest();
    await quickRoute();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('F9: the sent request has «Назад» to the main screen', async () => {
    const home = vi.fn();
    openRequest({ onBack: home });
    await toPoints();
    fireEvent.click(screen.getByText('Tushirish joyi'));
    await takePoint('Yangi Margʻilon');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrov qoldirildi');
    await tap('Orqaga');
    expect(home).toHaveBeenCalledOnce();
  });
});
