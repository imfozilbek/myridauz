import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

describe('StartPage', () => {
  it('opens the main screen with 3 actions', () => {
    const { tracked } = renderInShell(<StartPage />);
    for (const action of ['Arizalar', 'Shikoyatlar', 'Statistika'])
      expect(screen.getByText(action)).toBeTruthy();
    expect(tracked.map((event) => event.screen)).toEqual(['home']);
  });

  it('opens a section and comes back', () => {
    renderInShell(<StartPage />);
    fireEvent.click(screen.getByText('Shikoyatlar'));
    expect(screen.getByText('Bu boʻlim tez orada ishga tushadi.')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('Arizalar')).toBeTruthy();
  });

  it('opens the queue of driver applications (G06)', async () => {
    const clients = testClients({ moderation: { queue: async () => [] } });
    renderInShell(<StartPage />, false, true, undefined, clients);
    fireEvent.click(screen.getByText('Arizalar'));
    expect(await screen.findByText('Yangi ariza yoʻq')).toBeTruthy();
  });
});
