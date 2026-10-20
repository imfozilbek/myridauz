import type { WaitlistDirection, WaitlistStats } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderManagement } from '../../manage/manage-test-kit';
import { StatsScreen } from '../../stats/stats-screen';
import { statsOf } from '../../stats/stats-fixtures';
import { renderInShell, testClients } from '../../test-shell';
import { waitlistPlaces } from '../waitlist-test-kit';
import { OVERVIEW } from './team-fixtures';

afterEach(cleanup);
const DIRECTION: WaitlistDirection = {
  region: '1718',
  since: Date.parse('2026-10-18T05:00:00Z'),
  passengers: {
    count: 124,
    cadences: [{ cadence: 'weekly', count: 61 }],
    pains: [{ pain: 'chats', count: 79, share: 64 }],
  },
  drivers: {
    count: 9,
    cadences: [{ cadence: 'daily', count: 2 }],
    pains: [{ pain: 'empty', count: 5, share: 56 }],
    approved: 4,
  },
  opened: null,
};
const GOLD: WaitlistStats = {
  after: { listed: 100, joined: 46, invited: 19, byFriends: 40 },
  sources: [{ source: 'channel', opened: 612, listed: 453 }],
  devices: [{ platform: 'android', opened: 1420, listed: 937 }],
  hours: [
    { from: 18, count: 27 },
    { from: 3, count: 2 },
  ],
  shortage: [{ region: '1703', passengers: 87, drivers: 1 }],
  cadences: [{ cadence: 'weekly', count: 38 }],
  bothRoles: 21,
};
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

describe('«Kutish roʻyxati» of «Boshqaruv» (G83, docs/181)', () => {
  it('closes the list after the sheet asks again', async () => {
    const setSwitch = vi.fn(async (open: boolean) => ({ open, at: 1, links: 4 }));
    renderManagement({
      waitlist: {
        switchState: async () => ({ open: true, at: null, links: 4 }),
        overview: async () => OVERVIEW,
        setSwitch,
      },
    });
    expect(await screen.findByText('Ochiq: yangi odamlar roʻyxatga yoziladi')).toBeTruthy();
    expect(screen.getByText('4 ta havola')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Roʻyxatga yozish' }));
    expect(await screen.findByText('Roʻyxatni yopasizmi?')).toBeTruthy();
    expect(
      screen.getByText('Kutayotgan 1 326 kishiga hozir xabar ketmaydi: har yoʻnalish ochilganda yozamiz.'),
    ).toBeTruthy();
    press('Yopish');
    await waitFor(() => expect(setSwitch).toHaveBeenCalledWith(false));
  });
});

describe('«Kutayotganlar» and the «gold» of «Statistika» (docs/181, docs/183)', () => {
  it('shows the waiting people, opens a direction once, and tells the gold', async () => {
    const openDirection = vi.fn(async () => ({ at: 1, sent: 133 }));
    const clients = testClients({
      moderation: { me: async () => ({ id: null, firstName: 'Ali', hasAvatar: false, role: 'owner' }) },
      stats: { get: async (period) => statsOf(period) },
      waitlist: {
        overview: async () => OVERVIEW,
        direction: async () => DIRECTION,
        openDirection,
        stats: async () => GOLD,
      },
    });
    renderInShell(<StatsScreen onBack={() => undefined} />, false, true, waitlistPlaces, clients);
    expect(await screen.findByText('1 240 yoʻlovchi · 86 haydovchi')).toBeTruthy();
    expect(screen.getByText(/^Eng koʻp ogʻriq: Telegram guruh\S+ tartibsizlik$/u)).toBeTruthy();
    expect(await screen.findByText('87:1')).toBeTruthy();
    expect(screen.getByText('00:00 … 06:00')).toBeTruthy();
    press(/^Toshkent shahri ↔ Samarqand viloyati/u);
    expect(await screen.findByText('Ariza tasdiqlangan')).toBeTruthy();
    const share = screen.getByText('64 %').closest('div') as HTMLElement;
    expect(within(share).getByText(/^Telegram guruh\S+ tartibsizlik$/u)).toBeTruthy();
    press('Yoʻnalishni ochish');
    press(await screen.findByText('Ochish').then(() => 'Ochish'));
    await waitFor(() => expect(openDirection).toHaveBeenCalledWith('1718'));
  });

  // G90 ADM-1: opening a direction is the owner's (ownerOnly): a moderator reads it, no button.
  it('a moderator reads a direction and cannot open it', async () => {
    const clients = testClients({
      moderation: { me: async () => ({ id: null, firstName: 'Nodir', hasAvatar: false, role: 'moderator' }) },
      stats: { get: async (period) => statsOf(period) },
      waitlist: { overview: async () => OVERVIEW, direction: async () => DIRECTION, stats: async () => GOLD },
    });
    renderInShell(<StatsScreen onBack={() => undefined} />, false, true, waitlistPlaces, clients);
    press(
      await screen
        .findByText(/^Toshkent shahri ↔ Samarqand viloyati/u)
        .then(() => /^Toshkent shahri ↔ Samarqand viloyati/u),
    );
    expect(await screen.findByText('Ariza tasdiqlangan')).toBeTruthy();
    expect(screen.queryByText('Yoʻnalishni ochish')).toBeNull();
  });
});
