import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { MomentGate } from './moment-gate';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const JOIN = { moment: 'join', link: 'https://t.me/brand_bot?startapp=__share-join-a1b2c3' } as const;

// G87 (docs/191): a button under a message of a bot opens the app with ?via=bot-…, and the launch is
// still a plain one: the moment of a new passenger is offered as before.
describe('a moment at a launch from a button of a bot message', () => {
  it('greets a new passenger as at a launch from the menu', async () => {
    window.history.replaceState(null, '', '/?via=bot-zone');
    renderMarket(
      <MomentGate enabled>
        <p>Asosiy</p>
      </MomentGate>,
      testClients({ growth: { moment: async () => JOIN, offered: async () => undefined } }),
    );
    expect(await screen.findByText(/^Siz .+ jamoasidasiz! 🎉$/u)).toBeTruthy();
  });
});
