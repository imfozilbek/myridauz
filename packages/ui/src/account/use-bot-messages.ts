import { useEffect } from 'react';
import { requestBotMessages } from '../telegram/permissions';
import type { Account } from './account-context';

// People who came from a channel link never pressed "Start": ask Telegram once
// to let the bot write, otherwise trip notifications cannot reach them (docs/15).
export function useBotMessages(account: Account | null): void {
  const client = account?.client;
  const needed = account !== null && !account.profile.writeAccess;
  useEffect(() => {
    if (!client || !needed) return;
    void requestBotMessages().then((allowed) => (allowed ? client.setWriteAccess(true) : undefined));
  }, [client, needed]);
}
