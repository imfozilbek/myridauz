import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickRoute, takePoint, tap } from './market-test-kit';
import { openRequest } from './request-test-kit';

const RESTORED = 'Oldingi yozganingiz tiklandi.';
afterEach(cleanup);
beforeEach(() => localStorage.clear());

// From the main screen to the price: the route, tomorrow, «Uyimdan», both points.
async function toPrice() {
  await quickRoute();
  await tap(/^Ertaga/);
  await tap('Uyimdan');
  await takePoint('Chorsu bozori yaqinida');
  await takePoint('Yangi Margʻilon');
  await screen.findByText(/^Tavsiya/);
}

describe('NewRequestFlow keeps its answers (docs/94 F3, F8, F9)', { timeout: 20_000 }, () => {
  it('«Назад» shows each step with its answer, the way stays ticked', async () => {
    openRequest();
    await toPrice();
    await tap('Orqaga');
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await tap('Orqaga');
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    await tap('Orqaga');
    // The way has its tick: «Davom etish» keeps it, and the kept points lead to the price.
    await tap('Davom etish');
    expect(await screen.findByText(/^Tavsiya/)).toBeTruthy();
  });

  it('a closed app opens the same step; sent, the draft is gone and «Назад» leads home', async () => {
    openRequest();
    await toPrice();
    cleanup();
    const publishRequest = openRequest();
    expect(await screen.findByText(/^Tavsiya/)).toBeTruthy();
    expect(screen.getByText(RESTORED)).toBeTruthy();
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrov qoldirildi')).toBeTruthy();
    expect(publishRequest).toHaveBeenCalledWith(expect.objectContaining({ seats: 1, price: 95000 }));
    cleanup();
    openRequest();
    await quickRoute();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('F9: the sent request has «Назад» to the main screen', async () => {
    const home = vi.fn();
    openRequest({ onBack: home });
    await toPrice();
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    await screen.findByText('Soʻrov qoldirildi');
    await tap('Orqaga');
    expect(home).toHaveBeenCalledOnce();
  });
});
