import type { RideRequestInput } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { chooseWay, recommendation, renderMarket, tap } from './market-test-kit';
import { NewRequestFlow } from './new-request-flow';

const RESTORED = 'Oldingi yozganingiz tiklandi.';
afterEach(cleanup);
beforeEach(() => localStorage.clear());

function open(onBack = () => undefined) {
  const publishRequest = vi.fn(async (input: RideRequestInput) => ({
    ...input,
    id: 'r1',
    passenger: { id: '00000000000000000000000000000001', firstName: 'Ali', hasAvatar: false },
    km: 320,
    status: 'open' as const,
  }));
  const clients = testClients({ market: { recommend: async () => recommendation, publishRequest } });
  renderMarket(<NewRequestFlow onBack={onBack} />, clients);
  return publishRequest;
}

describe('NewRequestFlow keeps its answers (docs/94 F3, F8, F9)', { timeout: 20_000 }, () => {
  it('«Назад» from the day shows both points of the way, and the day stays ticked', async () => {
    open();
    await chooseWay();
    await tap(/^Ertaga/);
    await screen.findByText('Necha kishi ketadi?');
    await tap('Orqaga');
    await tap('Orqaga');
    expect((await screen.findAllByText('Chilonzor')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fargʻona shahri').length).toBeGreaterThan(0);
    await tap('Davom etish');
    await tap('Davom etish');
    expect(await screen.findByText('Necha kishi ketadi?')).toBeTruthy();
  });

  it('a closed app opens the same step; sent, the draft is gone and «Назад» leads home', async () => {
    open();
    await chooseWay();
    await tap(/^Ertaga/);
    await tap('2');
    await screen.findByText(/^Tavsiya/);
    cleanup();
    const publishRequest = open();
    expect(await screen.findByText(/^Tavsiya/)).toBeTruthy();
    expect(screen.getByText(RESTORED)).toBeTruthy();
    await tap('Davom etish');
    await tap('Soʻrov qoldirish');
    expect(await screen.findByText('Soʻrov qoldirildi')).toBeTruthy();
    expect(publishRequest).toHaveBeenCalledWith(expect.objectContaining({ seats: 2, price: 95000 }));
    cleanup();
    open();
    await chooseWay();
    expect(screen.queryByText(RESTORED)).toBeNull();
  });

  it('F9: the sent request has «Назад» to the main screen', async () => {
    const home = vi.fn();
    open(home);
    await chooseWay();
    for (const step of [/^Ertaga/, '1', 'Davom etish', 'Soʻrov qoldirish']) await tap(step);
    await screen.findByText('Soʻrov qoldirildi');
    await tap('Orqaga');
    expect(home).toHaveBeenCalledOnce();
  });
});
