import { toCyrillic } from '@platform/i18n';
import type { WalletClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { CARD, PERSON, renderManagement } from '../manage/manage-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { TeamWalletsScreen } from './team-wallets-screen';

afterEach(cleanup);

const owner = (firstName: string, id: string) => ({ driverId: id.repeat(32), firstName, bonus: 0, main: 0 });

// G79 К5 (docs/170): a driver found by the name, the wallet from the card in «Odamlar», the reason
// of a correction chosen, not typed (~8 taps → ~6).
describe('the wallets of the team in fewer taps', { timeout: 20_000 }, () => {
  it('finds a driver of «Hamyonlar» by the name', async () => {
    const all = async () => ({ wallets: [owner('Jasur', '7'), owner('Madina', '8')], more: false });
    renderMarket(<TeamWalletsScreen onBack={() => undefined} />, testClients({ wallet: { all } }));
    expect(await screen.findByText('Jasur')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(toCyrillic('Qidirish')), { target: { value: 'mad' } });
    expect(screen.queryByText('Jasur')).toBeNull();
    expect(screen.getByText('Madina')).toBeTruthy();
  });

  it('opens the wallet of a driver from the card in «Odamlar»', async () => {
    const of = vi.fn<WalletClient['of']>(async () => wallet);
    renderManagement({ wallet: { of } });
    await tap(toCyrillic('Odamlar'));
    fireEvent.change(screen.getByLabelText(toCyrillic('ID raqami')), { target: { value: PERSON } });
    await tap(toCyrillic('Ochish'));
    await tap(toCyrillic('Hamyon'));
    await waitFor(() => expect(of).toHaveBeenCalledWith(CARD.id));
    expect(await screen.findByText(toCyrillic('Hamyonni tuzatish'))).toBeTruthy();
  });

  it('takes a ready reason in one tap; «Boshqa» opens the box to type', async () => {
    const adjust = vi.fn<WalletClient['adjust']>(async () => wallet);
    renderManagement({ wallet: { of: async () => wallet, adjust } });
    await tap(toCyrillic('Odamlar'));
    fireEvent.change(screen.getByLabelText(toCyrillic('ID raqami')), { target: { value: PERSON } });
    await tap(toCyrillic('Ochish'));
    await tap(toCyrillic('Hamyon'));
    await tap(toCyrillic('Hamyonni tuzatish'));
    // «Boshqa» opens the box to type the reason; a ready one is one tap (G78 sheet 4).
    expect(screen.queryByLabelText(toCyrillic('Boshqa'))).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: toCyrillic('Boshqa') }));
    expect(document.activeElement).toBe(screen.getByLabelText(toCyrillic('Boshqa')));
    fireEvent.change(screen.getByLabelText(toCyrillic('Boshqa')), { target: { value: 'Oʻzim yozdim' } });
    await tap(toCyrillic('Kelmadi: komissiya qaytarildi'));
    expect(screen.queryByLabelText(toCyrillic('Boshqa'))).toBeNull();
    fireEvent.change(screen.getByLabelText(toCyrillic('Summa, soʻm')), { target: { value: '9000' } });
    await tap(toCyrillic('Qoʻshish'));
    await tap(toCyrillic('Saqlash'));
    expect(adjust).toHaveBeenCalledWith(CARD.id, {
      balance: 'bonus',
      amount: 9000,
      reason: toCyrillic('Kelmadi: komissiya qaytarildi'),
    });
  });
});
