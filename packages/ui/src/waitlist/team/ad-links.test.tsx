import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderManagement } from '../../manage/manage-test-kit';
import { AD, OVERVIEW, TRIPS_AD } from './team-fixtures';

afterEach(cleanup);
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

// The links of the ads (docs/184): into a bot of the trips or a channel (owner, 17.10.2026).
describe('«Reklama havolalari»', () => {
  it('makes a link for an ad, shows it ready and what one link gave', async () => {
    const createAd = vi.fn(async () => AD);
    renderManagement({
      waitlist: {
        switchState: async () => ({ open: true, at: null, links: 1 }),
        overview: async () => OVERVIEW,
        adLinks: async () => [AD],
        createAd,
        adLink: async () => AD,
      },
    });
    press(await screen.findByText('Reklama havolalari').then(() => /^Reklama havolalari/u));
    expect(await screen.findByText('Toshkent eʼlonlari')).toBeTruthy();
    expect(screen.getByText('3 kun · tepada 1 soat · qadalgan 24 soat')).toBeTruthy();
    press('Yangi havola');
    fireEvent.change(screen.getByRole('textbox', { name: 'Nomi' }), {
      target: { value: 'Andijon yangiliklari' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Doimiy' }));
    press('Havola yaratish');
    await waitFor(() =>
      expect(createAd).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Andijon yangiliklari', days: null, target: 'passenger' }),
      ),
    );
    expect(await screen.findByText(AD.link)).toBeTruthy();
    press('Orqaga');
    press(await screen.findByText('Toshkent eʼlonlari').then(() => /^Toshkent eʼlonlari/u));
    expect(await screen.findByText('Bitta yozilgan odam')).toBeTruthy();
    expect(screen.getByText('88 yoʻlovchi · 8 haydovchi')).toBeTruthy();
  });

  it('makes a link into the driver bot; a passenger bot link shows who registered', async () => {
    const createAd = vi.fn(async () => TRIPS_AD);
    renderManagement({
      waitlist: {
        switchState: async () => ({ open: false, at: 1, links: 1 }),
        overview: async () => OVERVIEW,
        adLinks: async () => [TRIPS_AD],
        createAd,
        adLink: async () => TRIPS_AD,
      },
    });
    press(await screen.findByText('Reklama havolalari').then(() => /^Reklama havolalari/u));
    expect(await screen.findByText('3 roʻyxatdan oʻtdi')).toBeTruthy();
    press('Yangi havola');
    fireEvent.click(screen.getByRole('radio', { name: 'Haydovchi boti' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nomi' }), { target: { value: 'Bloger Aziz' } });
    press('Havola yaratish');
    await waitFor(() => expect(createAd).toHaveBeenCalledWith(expect.objectContaining({ target: 'driver' })));
    expect(await screen.findByText(/Havola «Yoʻlovchi boti» ilovasini darhol ochadi\./u)).toBeTruthy();
    press('Orqaga');
    press(await screen.findByText('Bloger Aziz').then(() => /^Bloger Aziz/u));
    expect(await screen.findByText('Roʻyxatdan oʻtdi')).toBeTruthy();
    expect(screen.getByText('Bitta roʻyxatdan oʻtgan odam')).toBeTruthy();
    expect(screen.queryByText('Doʻst orqali yana yozildi')).toBeNull();
  });
});
