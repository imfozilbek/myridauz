import type { BrandColors } from '@platform/brands';
import { OUTSIDE_TELEGRAM, type TelegramSession } from './in-telegram-context';
import {
  backButton,
  closingBehavior,
  init,
  isTMA,
  mainButton,
  miniApp,
  retrieveLaunchParams,
  retrieveRawInitData,
  secondaryButton,
  swipeBehavior,
  viewport,
} from '@telegram-apps/sdk-react';

// Native Telegram behaviour (docs/21). Outside Telegram (browser, tests) the app works without it.
const APPLE_PLATFORMS = new Set(['ios', 'macos']);

export function initTelegram(colors: BrandColors): TelegramSession {
  if (!isTMA()) return OUTSIDE_TELEGRAM;
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
  const platform = APPLE_PLATFORMS.has(retrieveLaunchParams().tgWebAppPlatform) ? 'ios' : 'base';
  return { inTelegram: true, platform, initData: retrieveRawInitData() ?? '' };
}
