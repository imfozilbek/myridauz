import type { Page } from '@playwright/test';
import { STAND_API_PORT } from '../../scripts/stand/paths.ts';

// What a tap caused (G91): the calls to the API with their answers, the requests to Telegram
// (a link, a popup, the phone), and the screens the app reported as opened.
type Call = {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly error: string;
};
// asked: the calls sent, answered or not: a tap whose answer is slow still did something.
export type Effects = {
  readonly calls: Call[];
  readonly screens: string[];
  readonly asked: () => number;
  telegram: () => Promise<number>;
};

const API = `http://localhost:${STAND_API_PORT}`;
// Ids in a path are not part of its kind: /trips/<id>/bookings is one call for the report.
const pathKind = (path: string) => path.replace(/\/[0-9a-f]{32}|\/\d+/gu, '/:id');

// The SDK talks to Telegram all the time: the look of the buttons, the haptics, the viewport. A tap
// that did only that did nothing a person can notice.
const QUIET = new Set([
  'iframe_ready',
  'web_app_ready',
  'web_app_expand',
  'web_app_trigger_haptic_feedback',
  'web_app_request_viewport',
  'web_app_request_theme',
  'web_app_request_safe_area',
  'web_app_request_content_safe_area',
  'web_app_set_header_color',
  'web_app_set_background_color',
  'web_app_set_bottom_bar_color',
  'web_app_setup_main_button',
  'web_app_setup_secondary_button',
  'web_app_setup_back_button',
  'web_app_setup_settings_button',
  'web_app_setup_closing_behavior',
  'web_app_setup_swipe_behavior',
]);

type Sent = { readonly events?: readonly { name?: string; screen?: string }[] };

// The calls to the API still on the way, per page: the screen settles when none is left.
const loading = new WeakMap<Page, number>();
const SETTLED_MS = 150;
const MOST_WAIT_MS = 5_000;

export function watchEffects(page: Page): Effects {
  const calls: Call[] = [];
  let sent = 0;
  const screens: string[] = [];
  const ours = (url: string) => url.startsWith(API) && !url.endsWith('/analytics');
  const count = (step: number) => (url: string) => {
    if (ours(url)) loading.set(page, (loading.get(page) ?? 0) + step);
  };
  page.on('request', (request) => {
    count(1)(request.url());
    if (ours(request.url())) sent += 1;
  });
  page.on('requestfinished', (request) => count(-1)(request.url()));
  page.on('requestfailed', (request) => {
    count(-1)(request.url());
    const url = new URL(request.url());
    // A call that never got an answer (the network, a crash of the Worker): status 0.
    if (ours(request.url()))
      calls.push({ method: request.method(), path: pathKind(url.pathname), status: 0, error: 'failed' });
  });
  page.on('request', (request) => {
    if (!request.url().endsWith('/analytics') || request.method() !== 'POST') return;
    const sent = JSON.parse(request.postData() ?? '{}') as Sent;
    for (const event of sent.events ?? [])
      if (event.name === 'screen_open' && event.screen) screens.push(event.screen);
  });
  page.on('response', async (response) => {
    const url = new URL(response.url());
    if (url.origin !== API || url.pathname === '/analytics') return;
    const method = response.request().method();
    const status = response.status();
    const error =
      status >= 400
        ? await response
            .json()
            .then((body: { error?: unknown }) => String(body.error ?? ''))
            .catch(() => '')
        : '';
    calls.push({ method, path: pathKind(url.pathname), status, error });
  });
  const telegram = () =>
    page.evaluate(
      (quiet) =>
        (window as unknown as { __tg: { events: { type: string }[] } }).__tg.events.filter(
          (event) => !quiet.includes(event.type),
        ).length,
      [...QUIET],
    );
  return { calls, screens, asked: () => sent, telegram };
}

// The screen has settled: the answers came, the splash left, nothing is loading. An answer often
// asks the next call (an offer accepted, the lists, the seat): quiet means no call for a while.
const QUIET_MS = 500;
export async function settle(page: Page): Promise<void> {
  const until = Date.now() + MOST_WAIT_MS;
  await page.waitForTimeout(SETTLED_MS);
  let still = 0;
  while (still < QUIET_MS && Date.now() < until) {
    await page.waitForTimeout(SETTLED_MS);
    still = (loading.get(page) ?? 0) > 0 ? 0 : still + SETTLED_MS;
  }
  for (const busy of ['#splash', '[aria-busy="true"]'])
    await page
      .locator(busy)
      .first()
      .waitFor({ state: 'detached', timeout: MOST_WAIT_MS })
      .catch(() => undefined);
  await page.waitForTimeout(SETTLED_MS);
}
