import { shareMessage } from '@telegram-apps/sdk-react';
import { openInTelegram } from './feedback';

// Telegram's own "send to a chat" window with the prepared card (docs/21, docs/43). An old client
// gets the plain share link; outside Telegram a new tab opens. false: the person closed the window
// (share_done counts only a sent card, G69 docs/123); the plain link counts as sent.
export async function shareCard(preparedMessageId: string | null, link: string): Promise<boolean> {
  if (preparedMessageId) {
    const call = shareMessage.ifAvailable(preparedMessageId);
    if (call?.[0]) {
      try {
        await call[1];
        return true;
      } catch {
        return false;
      }
    }
  }
  openInTelegram(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
  return true;
}
