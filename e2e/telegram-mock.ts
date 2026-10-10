import type { Page } from '@playwright/test';

// Launch parameters that Telegram puts into the Mini App URL.
const INIT_DATA = new URLSearchParams({
  user: JSON.stringify({ id: 1, first_name: 'Test' }),
  auth_date: '1790000000',
  signature: 'test',
  hash: 'test',
}).toString();
const launch = (platform: 'android' | 'ios', initData: string) =>
  new URLSearchParams({
    tgWebAppPlatform: platform,
    tgWebAppVersion: '9.0',
    tgWebAppThemeParams: '{}',
    tgWebAppData: initData,
  }).toString();

// Most people in Uzbekistan use Android: the main screens are shot on both (lesson 52).
// The stand (docs/75) passes launch data signed with its test bot token.
export const telegramUrl = (url: string, platform: 'android' | 'ios' = 'ios', initData = INIT_DATA) =>
  `${url}#${launch(platform, initData)}`;

// A small Telegram client: answers SDK requests and draws the native header and main button,
// so tests and screenshots see what a person sees inside Telegram.
const MOCK = String((signedContact: string | null) => {
  const tg = { events: [] as { type: string; data: Record<string, unknown> }[], phoneShared: false };
  const CONTACT =
    signedContact ??
    new URLSearchParams({
      contact: JSON.stringify({ user_id: 1, phone_number: '998901234567', first_name: 'Test' }),
      auth_date: '1790000000',
      hash: 'test',
    }).toString();
  // The place and its accuracy; the rest of a location is unknown, as on most phones.
  const UNKNOWN = { altitude: null, course: null, speed: null, vertical_accuracy: null };
  const LOCATION = { latitude: 41.3113, longitude: 69.2795, horizontal_accuracy: 10, ...UNKNOWN };
  const UNKNOWN_ACCURACY = { course_accuracy: null, speed_accuracy: null };
  Object.assign(window, { __tg: tg });
  // Chrome 153+ in Telegram on Android and desktop gives a Promise from scrollTo (lesson 132).
  const scroll = window.scrollTo.bind(window);
  window.scrollTo = ((...args: Parameters<typeof scroll>) =>
    Promise.resolve(scroll(...args))) as unknown as typeof window.scrollTo;
  const reply = (type: string, data: unknown) =>
    setTimeout(() =>
      (
        window as unknown as { Telegram: { WebView: { receiveEvent: (t: string, d: unknown) => void } } }
      ).Telegram.WebView.receiveEvent(type, data),
    );
  const insets = { top: 0, bottom: 0, left: 0, right: 0 };
  const stable = { is_expanded: true, is_state_stable: true };
  const viewport = (height: number) => reply('viewport_changed', { height, width: innerWidth, ...stable });
  const BUTTON_SPACE = 64;
  // The buttons of Telegram are outside the page: no sheet turns their taps off, no tap reaches it.
  const TAPS = 'pointerdown pointerup mousedown mouseup touchstart touchend click'.split(' ');
  const FIXED = 'position:fixed;height:50px;border:0;border-radius:12px;display:none;pointer-events:auto';
  const nativeButton = (id: string, side: number, bottom: number, weight: number, event: string) => {
    const native = Object.assign(document.createElement('button'), { id });
    native.onclick = () => reply(event, undefined);
    native.style.cssText = `${FIXED};z-index:9;left:${side}px;right:${side}px;bottom:${bottom}px;font:${weight} 17px system-ui`;
    for (const kind of TAPS) native.addEventListener(kind, (tap) => tap.stopPropagation());
    return native;
  };
  const button = nativeButton('tg-main-button', 14, 14, 700, 'main_button_pressed');
  // The secondary button stands above the main one, as in Telegram (G18: "Qaytish safari").
  const second = nativeButton('tg-secondary-button', 16, 74, 600, 'secondary_button_pressed');
  // The bottom bar under the buttons is of the color the app asks for, as in Telegram (docs/21).
  const bar = document.createElement('div');
  bar.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${BUTTON_SPACE}px;display:none;z-index:8`;
  document.addEventListener('DOMContentLoaded', () => document.body.append(bar, button, second));
  Object.assign(window, {
    TelegramWebviewProxy: {
      postEvent(type: string, raw?: string) {
        const data = raw ? JSON.parse(raw) : {};
        tg.events.push({ type, data });
        if (type === 'web_app_request_viewport') viewport(innerHeight);
        if (type === 'web_app_request_safe_area') reply('safe_area_changed', insets);
        // "Are you sure?": the person taps the first button, as the scenario goes on (docs/65 B4).
        if (type === 'web_app_open_popup') reply('popup_closed', { button_id: data.buttons?.[0]?.id });
        if (type === 'web_app_request_content_safe_area') reply('content_safe_area_changed', insets);
        if (type === 'web_app_request_theme') reply('theme_changed', { theme_params: {} });
        if (type === 'web_app_set_bottom_bar_color') bar.style.background = data.color;
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
        // "Mening joylashuvim" (G22): the person allows the location, they stand in Tashkent.
        if (type === 'web_app_check_location')
          reply('location_checked', { available: true, access_requested: true, access_granted: true });
        if (type === 'web_app_request_location')
          reply('location_requested', { available: true, ...LOCATION, ...UNKNOWN_ACCURACY });
        if (type === 'web_app_setup_main_button') {
          button.textContent = data.text;
          button.style.background = data.color;
          button.style.color = data.text_color;
          button.style.display = data.is_visible ? 'block' : 'none';
          bar.style.display = button.style.display;
          // An inactive button sends nothing, as in Telegram (G58: the consent).
          button.disabled = data.is_active === false;
          // In Telegram the button is under the web view, not over it: the view gets shorter.
          viewport(data.is_visible ? innerHeight - BUTTON_SPACE : innerHeight);
        }
        if (type === 'web_app_setup_secondary_button') {
          second.textContent = data.text;
          if (data.color) second.style.background = data.color;
          if (data.text_color) second.style.color = data.text_color;
          second.style.display = data.is_visible ? 'block' : 'none';
          // On the left of the main button, half of the bar each, as in Telegram (G76).
          const beside = data.is_visible && data.position === 'left';
          const spots = beside ? ['14px', '14px', 'calc(50% + 4px)'] : ['74px', '16px', '16px'];
          Object.assign(second.style, { bottom: spots[0], left: spots[1], right: spots[2] });
          button.style.left = beside ? 'calc(50% + 4px)' : '14px';
        }
      },
    },
  });
});

// contact: the shared phone signed like Telegram does, for the stand (docs/75).
export async function mockTelegram(page: Page, contact: string | null = null): Promise<void> {
  await page.addInitScript(`(${MOCK})(${JSON.stringify(contact)})`);
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

// The back arrow in the Telegram header, as a person taps it: only when Telegram shows it (G38, docs/103).
export async function pressBack(page: Page): Promise<void> {
  const setups = await telegramEvents(page, 'web_app_setup_back_button');
  if (setups.at(-1)?.is_visible !== true) throw new Error('«Назад» is hidden: a person cannot tap it');
  await page.evaluate(() =>
    (
      window as unknown as { Telegram: { WebView: { receiveEvent: (t: string, d: unknown) => void } } }
    ).Telegram.WebView.receiveEvent('back_button_pressed', undefined),
  );
}
