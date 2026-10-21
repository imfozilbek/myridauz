import type { WaitlistAnswers } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { WaitlistFlow } from './waitlist-flow';
import { entryOf, waitlistClients, waitlistPlaces } from './waitlist-test-kit';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const show = (clients: ReturnType<typeof waitlistClients>['clients']) =>
  renderInShell(<WaitlistFlow />, false, true, waitlistPlaces, clients);
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const ANSWERS: WaitlistAnswers = {
  role: 'passenger',
  pains: ['chats'],
  home: '1718',
  region: '1718',
  cadence: 'weekly',
};

describe('the questionnaire of the waitlist (G83, docs/181)', () => {
  it('goes role, pains, region, «Qachon», saves, then the channels and the result', async () => {
    const { clients, saved } = waitlistClients();
    const { tracked } = show(clients);
    await screen.findByText('Yoʻlovchiman');
    press(/^Yoʻlovchiman/u);
    expect(screen.getByText('Safar davomida qanday muammolarga duch kelgansiz?')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Davom etish' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /Shaxsiy raqam xavfsizligi/u }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Telegram guruhlaridagi/u }));
    press('Davom etish');
    press(await screen.findByText('Samarqand viloyati').then(() => 'Samarqand viloyati'));
    expect(screen.getByText('Toshkent shahri ↔ Samarqand viloyati')).toBeTruthy();
    press('Har hafta');
    expect(await screen.findByText('Yoʻnalishingiz kanallari')).toBeTruthy();
    expect(saved).toEqual([
      { role: 'passenger', pains: ['phone', 'chats'], home: '1718', region: '1718', cadence: 'weekly' },
    ]);
    press('Davom etish');
    expect(await screen.findByText('Siz roʻyxatdasiz')).toBeTruthy();
    const steps = tracked
      .filter((event) => event.name === 'waitlist_step')
      .map((event) => ('step' in event ? event.step : ''));
    expect(steps).toEqual(['opened', 'role', 'pains', 'route', 'when']);
  });

  it('asks a person of Toshkent shahri which region, and goes back step by step', async () => {
    const { clients, saved } = waitlistClients();
    show(clients);
    await screen.findByText('Haydovchiman');
    press(/^Haydovchiman/u);
    fireEvent.click(screen.getByRole('checkbox', { name: /Pustoy/u }));
    press('Davom etish');
    press(await screen.findByText('Toshkent shahri').then(() => 'Toshkent shahri'));
    expect(screen.getByText('Qaysi viloyatga qatnaysiz?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Toshkent shahri' })).toBeNull();
    press('Orqaga');
    expect(screen.getByText('Qaysi viloyatdansiz?')).toBeTruthy();
    press('Toshkent shahri');
    press('Andijon viloyati');
    expect(screen.getByText('Bu yoʻnalishda qanchalik tez-tez yurasiz?')).toBeTruthy();
    press('Har kuni');
    await waitFor(() =>
      expect(saved[0]).toMatchObject({ role: 'driver', home: '1726', region: '1703', cadence: 'daily' }),
    );
  });

  it('closed by the owner: a new person sees the trips instead of the questionnaire', async () => {
    const { clients } = waitlistClients({ open: false });
    show(clients);
    expect(await screen.findByRole('button', { name: 'Safar topish' })).toBeTruthy();
    expect(screen.queryByText('Kim boʻlib yoʻlga chiqasiz?')).toBeNull();
  });
});

describe('«Siz roʻyxatdasiz» of the waitlist (docs/181)', () => {
  it('shows who waits, the answers to the pains and invites a friend', async () => {
    const waiting = { passengers: 124, drivers: 12, share: 64 };
    const { clients, invited } = waitlistClients({
      entries: [entryOf({ ...ANSWERS, pains: ['chats'] }, { waiting })],
      channels: ['@x'],
    });
    const { tracked } = show(clients);
    expect(await screen.findByText('124 kishi kutmoqda')).toBeTruthy();
    expect(screen.getByText(/^Bu yoʻnalishda\. 64 % ini ham Telegram/u)).toBeTruthy();
    expect(screen.getByText('1 ta kanaldasiz')).toBeTruthy();
    vi.spyOn(window, 'open').mockReturnValue(null);
    press('Doʻstimni chaqiraman');
    await waitFor(() => expect(invited).toEqual(['passenger']));
    expect(
      tracked.some(
        (event) => event.name === 'waitlist_step' && 'step' in event && event.step === 'invite_sent',
      ),
    ).toBe(true);
  });

  it('changes one answer from «Oʻzgartirish» and writes the record of the other role', async () => {
    const { clients, saved } = waitlistClients({ entries: [entryOf(ANSWERS)] });
    show(clients);
    press(await screen.findByText('Oʻzgartirish').then(() => 'Oʻzgartirish'));
    await screen.findByText('Qachon');
    press(/^Qachon/u);
    press('Bir marta');
    await waitFor(() => expect(saved.at(-1)).toMatchObject({ role: 'passenger', cadence: 'once' }));
    press(await screen.findByText('Oʻzgartirish').then(() => 'Oʻzgartirish'));
    await screen.findByText(/Haydovchi sifatida/u);
    press(/^Haydovchi sifatida/u);
    fireEvent.click(screen.getByRole('checkbox', { name: /Qatʼiy narxlar/u }));
    press('Davom etish');
    press(await screen.findByText('Samarqand viloyati').then(() => 'Samarqand viloyati'));
    press('Baʼzan');
    await waitFor(() =>
      expect(saved.at(-1)).toMatchObject({ role: 'driver', pains: ['fixed'], cadence: 'sometimes' }),
    );
    expect(await screen.findByText('Haydovchi boʻlish')).toBeTruthy();
  });

  // G91 DRV-9: the owner closed the list: a new record of the other role is refused (waitlist.closed),
  // so «Oʻzgartirish» does not offer it; the record already there stays.
  it('offers no record of the other role while the list is closed', async () => {
    const { clients } = waitlistClients({ entries: [entryOf(ANSWERS)], open: false });
    show(clients);
    press(await screen.findByText('Oʻzgartirish').then(() => 'Oʻzgartirish'));
    expect(await screen.findByText('Qachon')).toBeTruthy();
    expect(screen.queryByText(/Haydovchi sifatida/u)).toBeNull();
  });
});
