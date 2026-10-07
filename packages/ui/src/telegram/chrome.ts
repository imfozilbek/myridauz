import { miniApp } from '@telegram-apps/sdk-react';

// The colors of the Telegram header, background and bottom bar (docs/21). A screen asks for its own
// colors; the splash, while it stands, holds them all in the color of the Mini App (docs/121 §4) and
// gives the screen its colors back when it leaves.
type Chrome = { readonly header: string; readonly bottom: string };
let screen: Chrome | undefined;
let splash: string | undefined;
// What waits for the splash to leave: the Telegram buttons of the first screen (docs/121 §4).
const afterSplash = new Set<() => void>();

function apply(): void {
  const chrome = splash === undefined ? screen : { header: splash, bottom: splash };
  if (!chrome) return;
  miniApp.setHeaderColor.ifAvailable(chrome.header);
  miniApp.setBackgroundColor.ifAvailable(chrome.bottom);
  miniApp.setBottomBarColor.ifAvailable(chrome.bottom);
}

export function paintScreen(chrome: Chrome): void {
  screen = chrome;
  apply();
}

// Telegram takes colors only once the app is mounted: the colors asked before come now.
export function paintMounted(fallback: Chrome): void {
  screen ??= fallback;
  apply();
}

export function paintSplash(color: string | undefined): void {
  splash = color;
  apply();
  if (color === undefined) afterSplash.forEach((listener) => listener());
}

export const splashStands = (): boolean => splash !== undefined;

export function onSplashLeft(listener: () => void): () => void {
  afterSplash.add(listener);
  return () => afterSplash.delete(listener);
}
