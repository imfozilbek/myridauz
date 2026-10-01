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

// "Are you sure?" in the native Telegram window (docs/19, principle 9); outside Telegram, the browser's.
export async function confirm(message: string, confirmText: string): Promise<boolean> {
  const buttons = [{ id: CONFIRM_ID, type: 'destructive', text: confirmText }, { type: 'cancel' }] as const;
  const shown = popup.show.ifAvailable({ message, buttons: [...buttons] });
  return shown?.[0] === true ? (await shown[1]) === CONFIRM_ID : window.confirm(message);
}

// A choice of up to 3 answers in the native Telegram window (docs/21). The id of the chosen one,
// null when closed; undefined outside Telegram: the screen shows the choice itself.
export async function choose(message: string, options: readonly { id: string; text: string }[]) {
  const buttons = options.map(({ id, text }) => ({ id, type: 'default' as const, text }));
  const shown = popup.show.ifAvailable({ message, buttons });
  if (shown?.[0] !== true) return undefined;
  return (await shown[1]) || null;
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
