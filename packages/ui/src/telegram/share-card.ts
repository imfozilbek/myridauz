import { shareMessage } from '@telegram-apps/sdk-react';
import { openInTelegram } from './feedback';

// Telegram's own "send to a chat" window with the prepared card (docs/21, docs/43). An old client
// gets the plain share link; outside Telegram a new tab opens.
export async function shareCard(preparedMessageId: string | null, link: string): Promise<void> {
  if (preparedMessageId) {
    const call = shareMessage.ifAvailable(preparedMessageId);
    if (call?.[0]) {
      try {
        await call[1];
      } catch {
        // The person closed the window: nothing to do.
      }
      return;
    }
  }
  openInTelegram(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
}
