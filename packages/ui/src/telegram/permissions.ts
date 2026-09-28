import { requestContactComplete, requestWriteAccess } from '@telegram-apps/sdk-react';

// Native Telegram prompts (docs/21). Each answers null or false when the person says no
// or when Telegram cannot ask (old client, outside Telegram).

// The phone comes signed by Telegram: the server checks that it is the own number (docs/17).
export async function requestSignedContact(): Promise<string | null> {
  const call = requestContactComplete.ifAvailable();
  if (!call?.[0]) return null;
  try {
    return (await call[1]).raw;
  } catch {
    return null;
  }
}

// A bot may write only after the person allowed it (docs/15): notifications about trips.
export async function requestBotMessages(): Promise<boolean> {
  const call = requestWriteAccess.ifAvailable();
  if (!call?.[0]) return false;
  try {
    return (await call[1]) === 'allowed';
  } catch {
    return false;
  }
}
