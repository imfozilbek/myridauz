import { closingBehavior, hapticFeedback, openLink, popup } from '@telegram-apps/sdk-react';

const CONFIRM_ID = 'confirm';

// Native Telegram feedback (docs/21). Each call does nothing outside Telegram.
export const haptic = {
  tap: () => void hapticFeedback.impactOccurred.ifAvailable('light'),
  success: () => void hapticFeedback.notificationOccurred.ifAvailable('success'),
  error: () => void hapticFeedback.notificationOccurred.ifAvailable('error'),
  // An incoming call shakes the phone with each ring (docs/08).
  ring: () => void hapticFeedback.notificationOccurred.ifAvailable('warning'),
};

// "Are you sure?" in the native Telegram window (docs/19, principle 9).
export async function confirm(message: string, confirmText: string): Promise<boolean> {
  const buttons = [{ id: CONFIRM_ID, type: 'default', text: confirmText }, { type: 'cancel' }] as const;
  const shown = popup.show.ifAvailable({ message, buttons: [...buttons] });
  return shown?.[0] === true ? (await shown[1]) === CONFIRM_ID : false;
}

// Asks before closing when a form has unsaved data (docs/21).
export function protectFromClosing(enabled: boolean): void {
  if (enabled) closingBehavior.enableConfirmation.ifAvailable();
  else closingBehavior.disableConfirmation.ifAvailable();
}

// A map or another site opens in Telegram's own browser; outside Telegram, in a new tab (docs/21).
export function openExternal(url: string): void {
  if (openLink.ifAvailable(url)?.[0] !== true) window.open(url, '_blank', 'noopener');
}
