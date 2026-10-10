import type { Wallet } from '@platform/contracts';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { approved, NOW, renderProfile } from './profile-test-kit';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  URL.createObjectURL = vi.fn(() => 'blob:photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const money = (bonus: number, main: number): Wallet => ({
  bonus,
  main,
  bonusExpiresAt: null,
  seatsLeft: null,
  operations: [],
});

function openDelete(wallet?: Wallet) {
  const mine = vi.fn(async () => wallet ?? money(0, 0));
  const rendered = wallet
    ? renderProfile({ app: 'driver' }, { driver: approved, clients: { wallet: { mine } } })
    : renderProfile();
  fireEvent.click(screen.getByText('Dilnoza'));
  fireEvent.click(screen.getByText('Maʼlumotlarimni oʻchirish'));
  return { ...rendered, mine };
}

// «Maʼlumotlaringiz oʻchirilsinmi?» (G75, mockup g75/5 A, docs/158 Ж): what goes, one red button.
describe('delete my data (docs/30, docs/58)', () => {
  it('lists what goes, removes it and starts again', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true });
    const { client } = openDelete();
    expect(screen.getByText('Maʼlumotlaringiz oʻchirilsinmi?')).toBeTruthy();
    expect(screen.getByText('Buni qaytarib boʻlmaydi.')).toBeTruthy();
    expect(screen.getByText('Ism, telefon va rasm')).toBeTruthy();
    expect(screen.getByText('Chatlar va mashina maʼlumotlari')).toBeTruthy();
    expect(screen.getByText('Faol safarlar va band qilingan joylar bekor boʻladi')).toBeTruthy();
    // A passenger has no wallet: nothing to warn about.
    expect(screen.queryByText(/^Hamyonda/u)).toBeNull();
    expect(screen.getByText('Oʻchirish').closest('.danger-button')).not.toBeNull();
    client.deleteMe.mockRejectedValueOnce(new Error('offline'));
    await act(async () => fireEvent.click(screen.getByText('Oʻchirish')));
    expect(screen.getByText(/qayta urinib/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Oʻchirish')));
    expect(client.deleteMe).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Maʼlumotlaringiz oʻchirildi')).toBeTruthy();
    fireEvent.click(screen.getByText('Yopish'));
    expect(reload).toHaveBeenCalled();
  });

  it('«Bekor qilish» goes back to «Profil» and removes nothing', () => {
    const { client } = openDelete();
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(screen.getByText('Maʼlumotlarimni oʻchirish')).toBeTruthy();
    expect(client.deleteMe).not.toHaveBeenCalled();
  });

  it('warns a driver that the bonus of the wallet goes too', async () => {
    openDelete(money(473_000, 0));
    expect(
      await screen.findByText(/^Hamyonda 473.000 soʻm bonus bor\. U ham oʻchadi va qaytmaydi\.$/u),
    ).toBeTruthy();
  });

  it('warns a driver about the money of the wallet, the bonus with it', async () => {
    openDelete(money(20_000, 50_000));
    expect(
      await screen.findByText(/^Hamyonda 70.000 soʻm bor\. U ham oʻchadi va qaytmaydi\.$/u),
    ).toBeTruthy();
  });

  it('says nothing of an empty wallet', async () => {
    const { mine } = openDelete(money(0, 0));
    await vi.waitFor(() => expect(mine).toHaveBeenCalled());
    expect(screen.queryByText(/^Hamyonda/u)).toBeNull();
  });
});
