import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

const EMPTY = { items: [], counts: { application: 0, complaint: 0, face: 0, support: 0 } };
const owner = (overrides: Parameters<typeof testClients>[0] = {}) =>
  testClients({
    moderation: { me: async () => ({ id: null, firstName: 'Fozil', hasAvatar: false, role: 'owner' }) },
    team: { navbat: async () => EMPTY, attention: async () => ({ signs: [] }) },
    ...overrides,
  });

// The main screen of the team (G75, docs/120, mockup g67/1); its parts: packages/ui/src/team.
describe('StartPage', () => {
  it('opens the main screen of the team', async () => {
    const { tracked } = renderInShell(<StartPage />, false, true, undefined, owner());
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
    expect(screen.getByText('Boshqaruv')).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home']);
  });

  it('opens «Boshqaruv» and comes back', async () => {
    const clients = owner({ stats: { get: () => new Promise(() => undefined) } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(await screen.findByText('Boshqaruv'));
    expect(screen.getByText('Narxlar')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    fireEvent.click(await screen.findByText('Boshqaruv'));
    fireEvent.click(screen.getByText('Statistika'));
    // The dashboard of G12 (docs/29): the periods show while the numbers load.
    expect(await screen.findByText('24 soat')).toBeTruthy();
  });

  it('opens an application of a link from the admin bot (G06)', async () => {
    window.history.replaceState(null, '', '/?application=00000000000000000000000000000005');
    const clients = owner({ moderation: { queue: async () => [], get: () => new Promise(() => undefined) } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    expect(await screen.findByText('Orqaga')).toBeTruthy();
    expect(screen.queryByText('Hammasi koʻrildi')).toBeNull();
  });

  it('opens the dashboard at once from a signal of the admin bot (G12)', async () => {
    window.history.replaceState(null, '', '/?stats=week');
    const periods: string[] = [];
    const get = (period: 'day' | 'week') => (periods.push(period), new Promise<never>(() => undefined));
    renderInShell(<StartPage />, false, true, undefined, owner({ stats: { get } }));
    expect(await screen.findByText('7 kun')).toBeTruthy();
    expect(periods).toEqual(['week']);
    expect(window.location.search).toBe('');
    // «Назад» from the dashboard of a bot link: the main screen in one tap (G77).
    fireEvent.click(screen.getByText('Orqaga'));
    expect(await screen.findByText('Hammasi koʻrildi')).toBeTruthy();
    expect(screen.queryByText('Narxlar')).toBeNull();
  });

  // «Diqqat» of the owner (G77, docs/168 B): the money of drivers opens «Hamyonlar», not the menu.
  it('«Diqqat» money opens «Hamyonlar» at once', async () => {
    const money = {
      kind: 'money' as const,
      name: 'Jasur',
      person: '00000000000000000000000000000007',
      seats: 3,
    };
    const attention = async () => ({ signs: [{ id: 's1', at: 0, sign: money }] });
    const all = async () => ({ wallets: [], more: false });
    renderInShell(
      <StartPage />,
      false,
      true,
      undefined,
      owner({
        team: { navbat: async () => EMPTY, attention },
        wallet: { all },
      }),
    );
    fireEvent.click(await screen.findByText('1 haydovchida pul kam'));
    expect(await screen.findByText('Hamyonlar')).toBeTruthy();
    expect(screen.queryByText('Narxlar')).toBeNull();
  });

  // Who the member is did not load: the error with «Qayta urinish», never an empty screen (G77).
  it('says the error when the team member does not load, and tries again', async () => {
    let fail = true;
    const me = async () => {
      if (fail) throw new Error('test.network');
      return { id: null, firstName: 'Fozil', hasAvatar: false, role: 'owner' as const };
    };
    renderInShell(<StartPage />, false, true, undefined, owner({ moderation: { me } }));
    expect(await screen.findByText('Xatolik yuz berdi')).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
    expect(await screen.findByText('Boshqaruv')).toBeTruthy();
  });
});
