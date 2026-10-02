import { closingBehavior } from '@telegram-apps/sdk-react';

// Telegram asks «close?» while at least one form or call holds it (docs/21, docs/94 F3, F5).
let holders = 0;

export function holdClosing(): () => void {
  holders += 1;
  if (holders === 1) closingBehavior.enableConfirmation.ifAvailable();
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    holders -= 1;
    if (holders === 0) closingBehavior.disableConfirmation.ifAvailable();
  };
}
