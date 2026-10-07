import type { BrandColors } from '@platform/brands';
import { paintMounted } from './chrome';
import { clientOf } from './client-name';
import { syncFromCloud } from './device-storage';
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
const PHONE_PLATFORMS = new Set(['ios', 'android', 'android_x']);

export function initTelegram(colors: BrandColors): TelegramSession {
  if (!isTMA()) return OUTSIDE_TELEGRAM;
  init();
  // White header, background and bottom bar until a screen or the splash asks for its own: light theme
  // only (docs/20).
  void miniApp.mount.ifAvailable()?.[1]?.then(() => paintMounted({ header: colors.bg, bottom: colors.bg }));
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
  // The small values of the person from their other phones (docs/88 L12); a failed sync keeps this phone's copy.
  void syncFromCloud().catch(() => undefined);
  const { tgWebAppPlatform: telegramPlatform, tgWebAppVersion } = retrieveLaunchParams();
  const platform = APPLE_PLATFORMS.has(telegramPlatform) ? 'ios' : 'base';
  const hasCamera = PHONE_PLATFORMS.has(telegramPlatform);
  const initData = retrieveRawInitData() ?? '';
  return {
    inTelegram: true,
    platform,
    initData,
    hasCamera,
    client: clientOf(telegramPlatform, tgWebAppVersion),
  };
}
