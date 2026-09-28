import type { Page } from '@playwright/test';

const TELEGRAM_SCRIPT = 'https://telegram.org/js/telegram-web-app.js';

// Replaces the Telegram script: tests run without network and record what the app asks from Telegram.
const MOCK = `window.Telegram = { WebApp: {
  calls: [],
  ready() { this.calls.push('ready'); },
  expand() { this.calls.push('expand'); },
} };`;

export async function mockTelegram(page: Page): Promise<void> {
  await page.route(TELEGRAM_SCRIPT, (route) => route.fulfill({ contentType: 'text/javascript', body: MOCK }));
}

export function telegramCalls(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { Telegram: { WebApp: { calls: string[] } } }).Telegram.WebApp.calls,
  );
}
