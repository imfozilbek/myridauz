import { ApiError, type ChatClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { launchArrival } from '../telegram/arrival';
import { testClients } from '../test-shell';
import { FollowGate } from './follow-gate';
import { TOKEN, TRIP } from './follow-test-kit';

afterEach(cleanup);

describe('a close person becomes a passenger (docs/18)', () => {
  it('leaves the card for the usual app with the registration', async () => {
    window.history.replaceState(null, '', `/?follow=${TOKEN}`);
    const { tracked } = renderMarket(
      <FollowGate enabled>
        <p>Roʻyxatdan oʻtish</p>
      </FollowGate>,
      testClients({ chat: { sharedTrip: async () => TRIP } }),
    );
    expect(await screen.findByText(/^Dilnozaning safari · /u)).toBeTruthy();
    await tap('Men ham yoʻlga chiqaman');
    expect(screen.getByText('Roʻyxatdan oʻtish')).toBeTruthy();
    expect(screen.queryByText(/^Dilnozaning safari/u)).toBeNull();
    expect(tracked.map((event) => event.name)).toContain('share_join');
    // The registration keeps the loop «Yaqinlarimga» and the code of the one who shared (G69).
    expect(launchArrival('android 11.2').via).toBe('follow-a1b2c3');
    window.history.replaceState(null, '', '/');
  });

  it('skips the card in the other apps and when the link is closed', async () => {
    window.history.replaceState(null, '', `/?follow=${TOKEN}`);
    renderMarket(
      <FollowGate enabled={false}>
        <p>Haydovchi</p>
      </FollowGate>,
      testClients({}),
    );
    expect(screen.getByText('Haydovchi')).toBeTruthy();
    cleanup();
    const closed = vi.fn<ChatClient['sharedTrip']>(async () => {
      throw new ApiError(404, 'shares.not_found');
    });
    renderMarket(
      <FollowGate enabled>
        <p>Roʻyxatdan oʻtish</p>
      </FollowGate>,
      testClients({ chat: { sharedTrip: closed } }),
    );
    await tap('Men ham yoʻlga chiqaman');
    expect(screen.getByText('Roʻyxatdan oʻtish')).toBeTruthy();
    window.history.replaceState(null, '', '/');
  });
});
