import { ApiError, type UsersClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderInShell } from '../test-shell';
import { active, fakeClient } from './account-test-kit';
import { TeamGate } from './team-gate';

afterEach(cleanup);

describe('TeamGate', () => {
  const team = (client: UsersClient) =>
    renderInShell(
      <TeamGate client={client}>
        <p>panel</p>
      </TeamGate>,
    );

  it('opens the panel only for the team', async () => {
    team(fakeClient(active));
    expect(await screen.findByText('panel')).toBeTruthy();
    team(fakeClient(new ApiError(403, 'auth.not_admin')));
    expect(await screen.findByText(/faqat .* jamoasi uchun/)).toBeTruthy();
    expect(screen.getByText(/^Safar uchun yoʻlovchi yoki haydovchi botini oching/)).toBeTruthy();
    team(fakeClient(new ApiError(500)));
    expect(await screen.findByText('Qayta urinish')).toBeTruthy();
  });
});
