import { expect, test, type Page } from './crash-guard';
import { loadBrand } from '@platform/brands';
import { soundFile } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { FAKE_MEDIA } from './call-mock';
import { chatSocket } from './chat-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// G54 (docs/115) for the owner review: a call rings on the main screen, «Ovozlar» in the admin.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, , ADMIN] = MINI_APPS;
const KEY = 'b00000000-0000-4000-8000-0000000000b2';
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/sounds-${name}.png`, fullPage: true });
};

test('passenger: a call opens its chat over the main screen and rings', async ({ page }) => {
  const { feed } = await mockApi(page, 'active');
  // Who calls and about which trip (G54): the booking of the chat as the passenger sees it.
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: confirmed, role: 'passenger' } }),
  );
  await page.addInitScript(FAKE_MEDIA);
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port)));
  await expect(page.getByText(t('common.myTrips'))).toBeVisible();
  await expect.poll(() => feed.sockets.length).toBeGreaterThan(0);
  feed.call(KEY);
  await expect.poll(() => chatSocket.current !== null).toBe(true);
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
  await expect(page.getByText(t('calls.incoming'))).toBeVisible();
  await expect(
    page.getByText(t('market.request.seats', { count: String(confirmed.seats) }), { exact: false }),
  ).toBeVisible();
  await take('1-incoming-from-home');
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'active', caller: 'other' } }));
  await expect(page.getByText(t('calls.headphones'))).toBeVisible();
  await take('1b-talking');
});

test('admin: the three sets, the owner picks the first', async ({ page }) => {
  await mockApi(page, 'active');
  const state = { set: '3', sets: ['1', '2', '3'], changedBy: null, changedAt: null, canEdit: true };
  const picked: unknown[] = [];
  await page.route('**/api/admin/sounds', async (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: state });
    picked.push(route.request().postDataJSON());
    return route.fulfill({ json: { ...state, set: '1', changedBy: 900, changedAt: Date.now() } });
  });
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await expect(page.getByText(t('common.admin.soundsHint'))).toBeVisible();
  await take('2-management');
  await page.getByText(t('common.admin.sounds'), { exact: true }).click();
  await expect(page.getByText(t('common.admin.soundSet', { n: '3' }))).toBeVisible();
  await take('3-sets');
  await page.getByText(t('common.admin.soundSet', { n: '1' })).click();
  await expect.poll(() => picked).toEqual([{ set: '1' }]);
  await take('4-picked');
});

test('every Mini App serves the ring and the notification of every set of the brand', async ({ request }) => {
  const { sounds } = loadBrand();
  expect(sounds.sets).toContain(sounds.defaultSet);
  for (const { port } of MINI_APPS)
    for (const set of sounds.sets)
      for (const kind of ['ring', 'notify'] as const) {
        const response = await request.get(`${appUrl(port)}${soundFile(set, kind)}`);
        expect(response.headers()['content-type'], soundFile(set, kind)).toContain('audio');
      }
});
