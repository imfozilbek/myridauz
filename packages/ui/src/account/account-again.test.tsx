import type { MeResponse } from '@platform/contracts';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { askAccountAgain } from '../network/account-again';
import { renderInShell } from '../test-shell';
import { AccountGate } from './account-gate';
import { active, fakeClient } from './account-test-kit';

afterEach(cleanup);

// G89 U12: blocked while the other Mini App of the person is open, a refused tap shows the block.
describe('a refusal about the person while the app is open', () => {
  it('shows the block at once', async () => {
    const client = fakeClient(active);
    renderInShell(
      <AccountGate app="passenger" client={client} welcome={{ logo: 'logo.svg', points: [] }}>
        <p>inside</p>
      </AccountGate>,
    );
    expect(await screen.findByText('inside')).toBeTruthy();
    const blocked: MeResponse = { state: 'blocked', until: null };
    client.getMe.mockResolvedValue(blocked);
    await act(async () => askAccountAgain());
    expect(await screen.findByText('Hisobingiz bloklangan')).toBeTruthy();
  });
});
