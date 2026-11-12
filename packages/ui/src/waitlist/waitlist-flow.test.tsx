import { toCyrillic } from '@platform/i18n';
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
    await screen.findByText(toCyrillic('Yoʻlovchiman'));
    press(/^Йўловчиман/u);
    expect(screen.getByText(toCyrillic('Safar davomida qanday muammolarga duch kelgansiz?'))).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: toCyrillic('Davom etish') }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /Шахсий рақам хавфсизлиги/u }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Telegram гуруҳларидаги/u }));
    press(toCyrillic('Davom etish'));
    press(
      await screen.findByText(toCyrillic('Samarqand viloyati')).then(() => toCyrillic('Samarqand viloyati')),
    );
    expect(screen.getByText(toCyrillic('Toshkent shahri ↔ Samarqand viloyati'))).toBeTruthy();
    press(toCyrillic('Har hafta'));
    expect(await screen.findByText(toCyrillic('Yoʻnalishingiz kanallari'))).toBeTruthy();
    expect(saved).toEqual([
      { role: 'passenger', pains: ['phone', 'chats'], home: '1718', region: '1718', cadence: 'weekly' },
    ]);
    press(toCyrillic('Davom etish'));
    expect(await screen.findByText(toCyrillic('Siz roʻyxatdasiz'))).toBeTruthy();
    const steps = tracked
      .filter((event) => event.name === 'waitlist_step')
      .map((event) => ('step' in event ? event.step : ''));
    expect(steps).toEqual(['opened', 'role', 'pains', 'route', 'when']);
  });

  it('asks a person of Toshkent shahri which region, and goes back step by step', async () => {
    const { clients, saved } = waitlistClients();
    show(clients);
    await screen.findByText(toCyrillic('Haydovchiman'));
    press(/^Ҳайдовчиман/u);
    fireEvent.click(screen.getByRole('checkbox', { name: /Пустой/u }));
    press(toCyrillic('Davom etish'));
    press(await screen.findByText(toCyrillic('Toshkent shahri')).then(() => toCyrillic('Toshkent shahri')));
    expect(screen.getByText(toCyrillic('Qaysi viloyatga qatnaysiz?'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: toCyrillic('Toshkent shahri') })).toBeNull();
    press(toCyrillic('Orqaga'));
    expect(screen.getByText(toCyrillic('Qaysi viloyatdansiz?'))).toBeTruthy();
    press(toCyrillic('Toshkent shahri'));
    press(toCyrillic('Andijon viloyati'));
    expect(screen.getByText(toCyrillic('Bu yoʻnalishda qanchalik tez-tez yurasiz?'))).toBeTruthy();
    press(toCyrillic('Har kuni'));
    await waitFor(() =>
      expect(saved[0]).toMatchObject({ role: 'driver', home: '1726', region: '1703', cadence: 'daily' }),
    );
  });

  it('closed by the owner: a new person sees the trips instead of the questionnaire', async () => {
    const { clients } = waitlistClients({ open: false });
    show(clients);
    expect(await screen.findByRole('button', { name: toCyrillic('Safar topish') })).toBeTruthy();
    expect(screen.queryByText(toCyrillic('Kim boʻlib yoʻlga chiqasiz?'))).toBeNull();
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
    expect(await screen.findByText(toCyrillic('124 kishi kutmoqda'))).toBeTruthy();
    expect(screen.getByText(/^Бу йўналишда\. 64 % ини ҳам Telegram/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('1 ta kanaldasiz'))).toBeTruthy();
    vi.spyOn(window, 'open').mockReturnValue(null);
    press(toCyrillic('Doʻstimni chaqiraman'));
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
    press(await screen.findByText(toCyrillic('Oʻzgartirish')).then(() => toCyrillic('Oʻzgartirish')));
    await screen.findByText(toCyrillic('Qachon'));
    press(/^Қачон/u);
    press(toCyrillic('Bir marta'));
    await waitFor(() => expect(saved.at(-1)).toMatchObject({ role: 'passenger', cadence: 'once' }));
    press(await screen.findByText(toCyrillic('Oʻzgartirish')).then(() => toCyrillic('Oʻzgartirish')));
    await screen.findByText(/Ҳайдовчи сифатида/u);
    press(/^Ҳайдовчи сифатида/u);
    fireEvent.click(screen.getByRole('checkbox', { name: /Қатъий нархлар/u }));
    press(toCyrillic('Davom etish'));
    press(
      await screen.findByText(toCyrillic('Samarqand viloyati')).then(() => toCyrillic('Samarqand viloyati')),
    );
    press(toCyrillic('Baʼzan'));
    await waitFor(() =>
      expect(saved.at(-1)).toMatchObject({ role: 'driver', pains: ['fixed'], cadence: 'sometimes' }),
    );
    expect(await screen.findByText(toCyrillic('Haydovchi boʻlish'))).toBeTruthy();
  });

  // G91 DRV-9: the owner closed the list: a new record of the other role is refused (waitlist.closed),
  // so «Oʻzgartirish» does not offer it; the record already there stays.
  it('offers no record of the other role while the list is closed', async () => {
    const { clients } = waitlistClients({ entries: [entryOf(ANSWERS)], open: false });
    show(clients);
    press(await screen.findByText(toCyrillic('Oʻzgartirish')).then(() => toCyrillic('Oʻzgartirish')));
    expect(await screen.findByText(toCyrillic('Qachon'))).toBeTruthy();
    expect(screen.queryByText(/Ҳайдовчи сифатида/u)).toBeNull();
  });
});
