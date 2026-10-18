// Launch parameters that Telegram puts into the Mini App URL.
const INIT_DATA = new URLSearchParams({
  user: JSON.stringify({ id: 1, first_name: 'Test' }),
  auth_date: '1790000000',
  signature: 'test',
  hash: 'test',
}).toString();
// tdesktop: Telegram on a computer, without a camera (docs/78 D04).
type LaunchPlatform = 'android' | 'ios' | 'tdesktop';
const launch = (platform: LaunchPlatform, initData: string) =>
  new URLSearchParams({
    tgWebAppPlatform: platform,
    tgWebAppVersion: '9.0',
    tgWebAppThemeParams: '{}',
    tgWebAppData: initData,
  }).toString();

// Most people in Uzbekistan use Android: the main screens are shot on both (lesson 52).
// The stand (docs/75) passes launch data signed with its test bot token.
export const telegramUrl = (url: string, platform: LaunchPlatform = 'ios', initData = INIT_DATA) =>
  `${url}#${launch(platform, initData)}`;
