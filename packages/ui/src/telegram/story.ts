import { shareStory } from '@telegram-apps/sdk-react';

// Telegram's own story editor (docs/88 L19). The link widget shows only for Premium; everybody
// gets the caption.
export const canShareStory = (): boolean => shareStory.isAvailable();

export function openStory(
  mediaUrl: string,
  text: string,
  link: { readonly url: string; readonly name: string },
) {
  shareStory.ifAvailable(mediaUrl, { text, widgetLink: link });
}
