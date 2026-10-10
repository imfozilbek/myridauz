import type { HexColor } from '@platform/brands';
import { secondaryButton } from '@telegram-apps/sdk-react';

type Look = {
  readonly backgroundColor?: HexColor;
  readonly textColor?: HexColor;
  readonly position?: ReturnType<typeof secondaryButton.position>;
};
let own: Look | null = null;

// Telegram's own look of the secondary button, read once before the block of the main screen
// paints it (G76): every other screen gets it back. Empty outside a real Telegram.
export function ownLook(): Look {
  try {
    own ??= {
      backgroundColor: secondaryButton.backgroundColor(),
      textColor: secondaryButton.textColor(),
      position: secondaryButton.position(),
    };
  } catch {
    own = {};
  }
  return own;
}
