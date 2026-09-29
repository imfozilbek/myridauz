import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

describe('StartPage', () => {
  it('opens the main screen with 3 actions', () => {
    const { tracked } = renderInShell(<StartPage />);
    for (const action of ['Arizalar', 'Shikoyatlar', 'Boshqaruv'])
      expect(screen.getByText(action)).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home']);
  });

  it('opens a section and comes back', async () => {
    const clients = testClients({ stats: { get: () => new Promise(() => undefined) } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText('Boshqaruv'));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Arizalar')).toBeTruthy();
    // Prices and statistics share the third action (docs/19: at most 3).
    fireEvent.click(screen.getByText('Boshqaruv'));
    expect(screen.getByText('Narxlar')).toBeTruthy();
    fireEvent.click(screen.getByText('Statistika'));
    // The dashboard of G12 (docs/29): the periods show while the numbers load.
    expect(await screen.findByText('24 soat')).toBeTruthy();
  });

  it('opens the queue of complaints (G11)', async () => {
    const clients = testClients({ feedback: { queue: async () => [] } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText('Shikoyatlar'));
    expect(await screen.findByText('Yangi shikoyat yoʻq')).toBeTruthy();
  });

  it('opens the queue of driver applications (G06)', async () => {
    const clients = testClients({ moderation: { queue: async () => [] } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText('Arizalar'));
    expect(await screen.findByText('Yangi ariza yoʻq')).toBeTruthy();
  });

  it('opens the dashboard at once from a signal of the admin bot (G12)', async () => {
    window.history.replaceState(null, '', '/?stats=week');
    const periods: string[] = [];
    const get = (period: 'day' | 'week') => (periods.push(period), new Promise<never>(() => undefined));
    renderInShell(<StartPage />, false, true, undefined, testClients({ stats: { get } }));
    expect(await screen.findByText('7 kun')).toBeTruthy();
    expect(periods).toEqual(['week']);
    expect(window.location.search).toBe('');
  });
});
