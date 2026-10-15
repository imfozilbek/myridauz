import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../test-shell';
import { SubscriptionsLink } from './subscriptions-link';

vi.mock('./subscriptions-screen', () => ({
  SubscriptionsScreen: (): never => {
    throw new Error('boom');
  },
}));
afterEach(cleanup);

describe('SubscriptionsLink (G52)', () => {
  it('a broken screen of a bot link goes back to the app, the app stays', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/?subscriptions=1');
    renderInShell(
      <SubscriptionsLink>
        <p>ilova</p>
      </SubscriptionsLink>,
    );
    expect(screen.getByText('Xatolik yuz berdi')).toBeTruthy();
    fireEvent.click(screen.getByText('Orqaga'));
    expect(screen.getByText('ilova')).toBeTruthy();
    window.history.replaceState(null, '', '/');
  });
});
