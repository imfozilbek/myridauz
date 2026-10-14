import { renderInShell, testClients } from '@platform/ui/testing';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StartPage } from './start-page';

afterEach(cleanup);

// The questionnaire of the main bot (G83, docs/181); its screens: packages/ui/src/waitlist.
describe('StartPage', () => {
  it('opens the questionnaire for a new person', async () => {
    const waitlist = { open: async () => ({ open: true, entries: [], channels: [] }) };
    renderInShell(<StartPage />, false, true, undefined, testClients({ waitlist }));
    expect(await screen.findByText('Kim boʻlib yoʻlga chiqasiz?')).toBeTruthy();
  });
});
