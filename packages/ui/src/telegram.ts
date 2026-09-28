// Only the part of the Telegram Mini Apps API that the code uses.
type TelegramWebApp = {
  ready(): void;
  expand(): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

// Tells Telegram the app is ready, so it hides its loader and opens full height.
export function signalTelegramReady(): void {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready();
  webApp?.expand();
}
