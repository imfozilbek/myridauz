import { hapticFeedback, miniApp, openLink, openTelegramLink, popup } from '@telegram-apps/sdk-react';

const CONFIRM_ID = 'confirm';

// Native Telegram feedback (docs/21). Each call does nothing outside Telegram.
export const haptic = {
  tap: () => void hapticFeedback.impactOccurred.ifAvailable('light'),
  success: () => void hapticFeedback.notificationOccurred.ifAvailable('success'),
  error: () => void hapticFeedback.notificationOccurred.ifAvailable('error'),
  // A choice changed in a list, the stars or a switch (docs/88 L3).
  select: () => void hapticFeedback.selectionChanged.ifAvailable(),
  // An incoming call shakes the phone with each ring (docs/08).
  ring: () => void hapticFeedback.notificationOccurred.ifAvailable('warning'),
  // A new or more urgent thing in the block of the main screen: one shake (G76, docs/165).
  attention: () => void hapticFeedback.notificationOccurred.ifAvailable('warning'),
};

// "Are you sure?" in the native Telegram window (docs/19, principle 9); outside Telegram, the browser's.
export async function confirm(message: string, confirmText: string): Promise<boolean> {
  const buttons = [{ id: CONFIRM_ID, type: 'destructive', text: confirmText }, { type: 'cancel' }] as const;
  const shown = popup.show.ifAvailable({ message, buttons: [...buttons] });
  return shown?.[0] === true ? (await shown[1]) === CONFIRM_ID : window.confirm(message);
}

// A map or another site opens in Telegram's own browser; outside Telegram, in a new tab (docs/21).
export function openExternal(url: string): void {
  if (openLink.ifAvailable(url)?.[0] !== true) window.open(url, '_blank', 'noopener');
}

// A t.me link opens inside Telegram without leaving the Mini App (docs/21); outside Telegram, in a new tab.
export function openInTelegram(url: string): void {
  if (openTelegramLink.ifAvailable(url)?.[0] !== true) window.open(url, '_blank', 'noopener');
}

// The Mini App closes and the person is back in the bot chat (docs/94 C1); outside Telegram, nothing.
export function closeApp(): void {
  miniApp.close.ifAvailable();
}
