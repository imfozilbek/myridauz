import type { UsersClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInShell } from '../../test-shell';
import { AccountContext, type Account } from '../account-context';
import { BotNews } from './bot-news';

const permissions = vi.hoisted(() => ({ requestBotMessages: vi.fn(async () => true) }));
vi.mock('../../telegram/permissions', () => permissions);

const render = (news: boolean, writeAccess: boolean, setNews: UsersClient['setNews']) => {
  const client = { setNews, setWriteAccess: vi.fn(async () => undefined) } as unknown as UsersClient;
  const account = {
    client,
    profile: { news, writeAccess },
    onProfileChanged: vi.fn(),
  } as unknown as Account;
  renderInShell(
    <AccountContext.Provider value={account}>
      <BotNews />
    </AccountContext.Provider>,
  );
  return { client, account };
};

afterEach(cleanup);

describe('«Bot xabarlari» in the profile (docs/88 L1)', () => {
  it('turns the news off and says that booking messages still come', async () => {
    const setNews = vi.fn(async () => undefined);
    const { account } = render(true, true, setNews);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bot xabarlari' }));
    await waitFor(() => expect(account.onProfileChanged).toHaveBeenCalled());
    expect(setNews).toHaveBeenCalledWith(false);
    expect(screen.getByText(/kelmaydi\. Bron va chat xabarlari har doim keladi/)).toBeTruthy();
  });

  it('asks Telegram to let the bot write when it was never allowed', async () => {
    const { client } = render(
      false,
      false,
      vi.fn(async () => undefined),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bot xabarlari' }));
    await waitFor(() => expect(client.setWriteAccess).toHaveBeenCalledWith(true));
    expect(permissions.requestBotMessages).toHaveBeenCalled();
  });

  it('goes back and says why when the server failed (G43, docs/65 B3)', async () => {
    render(
      true,
      true,
      vi.fn(async () => Promise.reject(new Error('net'))),
    );
    const toggle = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Bot xabarlari' });
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle.checked).toBe(true));
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
  });
});
