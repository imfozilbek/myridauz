import type { BrandColors } from '@platform/brands';
import {
  backButton,
  closingBehavior,
  init,
  isTMA,
  mainButton,
  miniApp,
  secondaryButton,
  swipeBehavior,
  viewport,
} from '@telegram-apps/sdk-react';

// Native Telegram behaviour (docs/21). Outside Telegram (browser, tests) the app works without it.
export function initTelegram(colors: BrandColors): boolean {
  if (!isTMA()) return false;
  init();
  void miniApp.mount.ifAvailable()?.[1]?.then(() => {
    // White header, background and bottom bar: light theme only (docs/20).
    miniApp.setHeaderColor.ifAvailable(colors.bg);
    miniApp.setBackgroundColor.ifAvailable(colors.bg);
    miniApp.setBottomBarColor.ifAvailable(colors.bg);
  });
  void viewport.mount.ifAvailable()?.[1]?.then(() => {
    viewport.expand.ifAvailable();
    viewport.bindCssVars.ifAvailable();
  });
  for (const component of [mainButton, secondaryButton, backButton, closingBehavior, swipeBehavior]) {
    component.mount.ifAvailable();
  }
  // A swipe must not close the app by accident (docs/21).
  swipeBehavior.disableVertical.ifAvailable();
  miniApp.ready.ifAvailable();
  return true;
}
