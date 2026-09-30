import type { Page } from '@playwright/test';

// Launch parameters that Telegram puts into the Mini App URL.
const INIT_DATA = new URLSearchParams({
  user: JSON.stringify({ id: 1, first_name: 'Test' }),
  auth_date: '1790000000',
  signature: 'test',
  hash: 'test',
}).toString();
const LAUNCH = new URLSearchParams({
  tgWebAppPlatform: 'ios',
  tgWebAppVersion: '9.0',
  tgWebAppThemeParams: '{}',
  tgWebAppData: INIT_DATA,
}).toString();

export const telegramUrl = (url: string) => `${url}#${LAUNCH}`;

// A small Telegram client: answers SDK requests and draws the native header and main button,
// so tests and screenshots see what a person sees inside Telegram.
const MOCK = String(() => {
  const tg = { events: [] as { type: string; data: Record<string, unknown> }[], phoneShared: false };
  const CONTACT = new URLSearchParams({
    contact: JSON.stringify({ user_id: 1, phone_number: '998901234567', first_name: 'Test' }),
    auth_date: '1790000000',
    hash: 'test',
  }).toString();
  Object.assign(window, { __tg: tg });
  const reply = (type: string, data: unknown) =>
    setTimeout(() =>
      (
        window as unknown as { Telegram: { WebView: { receiveEvent: (t: string, d: unknown) => void } } }
      ).Telegram.WebView.receiveEvent(type, data),
    );
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const button = document.createElement('button');
  button.id = 'tg-main-button';
  button.style.cssText =
    'position:fixed;left:16px;right:16px;bottom:16px;height:50px;border:0;border-radius:12px;font:600 17px system-ui;display:none;z-index:9';
  button.onclick = () => reply('main_button_pressed', undefined);
  // The secondary button stands above the main one, as in Telegram (G18: "Qaytish safari").
  const second = document.createElement('button');
  second.id = 'tg-secondary-button';
  second.style.cssText =
    'position:fixed;left:16px;right:16px;bottom:74px;height:50px;border:0;border-radius:12px;font:600 17px system-ui;display:none;z-index:9';
  second.onclick = () => reply('secondary_button_pressed', undefined);
  document.addEventListener('DOMContentLoaded', () => document.body.append(button, second));
  Object.assign(window, {
    TelegramWebviewProxy: {
      postEvent(type: string, raw?: string) {
        const data = raw ? JSON.parse(raw) : {};
        tg.events.push({ type, data });
        if (type === 'web_app_request_viewport')
          reply('viewport_changed', {
            height: innerHeight,
            width: innerWidth,
            is_expanded: true,
            is_state_stable: true,
          });
        if (type === 'web_app_request_safe_area') reply('safe_area_changed', insets);
        if (type === 'web_app_request_content_safe_area') reply('content_safe_area_changed', insets);
        if (type === 'web_app_request_theme') reply('theme_changed', { theme_params: {} });
        // Phone sharing (requestContact) and bot messages (requestWriteAccess), as a person allows them.
        if (type === 'web_app_request_phone') {
          tg.phoneShared = true;
          reply('phone_requested', { status: 'sent' });
        }
        if (type === 'web_app_invoke_custom_method' && data.method === 'getRequestedContact') {
          const answer = tg.phoneShared ? { result: CONTACT } : { error: 'no contact' };
          reply('custom_method_invoked', { req_id: data.req_id, ...answer });
        }
        if (type === 'web_app_request_write_access') reply('write_access_requested', { status: 'allowed' });
        if (type === 'web_app_setup_main_button') {
          button.textContent = data.text;
          button.style.background = data.color;
          button.style.color = data.text_color;
          button.style.display = data.is_visible ? 'block' : 'none';
        }
        if (type === 'web_app_setup_secondary_button') {
          second.textContent = data.text;
          if (data.color) second.style.background = data.color;
          if (data.text_color) second.style.color = data.text_color;
          second.style.display = data.is_visible ? 'block' : 'none';
        }
      },
    },
  });
});

export async function mockTelegram(page: Page): Promise<void> {
  await page.addInitScript(`(${MOCK})()`);
}

export function telegramEvents(page: Page, type: string): Promise<Record<string, unknown>[]> {
  return page.evaluate(
    (name) =>
      (
        window as unknown as { __tg: { events: { type: string; data: Record<string, unknown> }[] } }
      ).__tg.events
        .filter((event) => event.type === name)
        .map((event) => event.data),
    type,
  );
}

// The back arrow in the Telegram header, as a person taps it.
export function pressBack(page: Page): Promise<void> {
  return page.evaluate(() =>
    (
      window as unknown as { Telegram: { WebView: { receiveEvent: (t: string, d: unknown) => void } } }
    ).Telegram.WebView.receiveEvent('back_button_pressed', undefined),
  );
}
