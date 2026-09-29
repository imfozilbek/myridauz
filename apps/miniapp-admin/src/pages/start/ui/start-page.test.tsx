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

  it('opens a section and comes back', () => {
    renderInShell(<StartPage />);
    fireEvent.click(screen.getByText('Boshqaruv'));
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Arizalar')).toBeTruthy();
    // Prices and statistics share the third action (docs/19: at most 3).
    fireEvent.click(screen.getByText('Boshqaruv'));
    expect(screen.getByText('Narxlar')).toBeTruthy();
    fireEvent.click(screen.getByText('Statistika'));
    expect(screen.getByText('Bu boʻlim tez orada ishga tushadi.')).toBeTruthy();
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
});
