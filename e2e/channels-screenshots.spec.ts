import { expect, test, type Page } from './crash-guard';
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const brand = loadBrand();
const shot = (page: Page) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/channels-${name}.png`, fullPage: true });
};
// The channels of the directions of the brand and one channel of the team (docs/176).
const fixed = brand.channels.map(({ chat, link, title, places }) => ({
  chat,
  link,
  title,
  places,
  fixed: true,
}));
const shahrisabz = {
  chat: '@ch_shahrisabz',
  link: 'https://t.me/ch_shahrisabz',
  title: 'Kanal | Shahrisabz',
  places: ['1710245'],
  fixed: false,
};

test('admin: the channels, a district channel with its neighbours', async ({ page }) => {
  await mockApi(page, 'active');
  const saved: unknown[] = [];
  await page.route('**/api/admin/channels', (route) =>
    route.fulfill({ json: { channels: [...fixed, shahrisabz] } }),
  );
  await page.route('**/api/admin/channels/*', async (route) => {
    saved.push(route.request().postDataJSON());
    await route.fulfill({ json: { ...shahrisabz, ...route.request().postDataJSON() } });
  });
  // G87 V5, V6: the week of three channels of the brand, the joins and leaves and the best post.
  const week = [
    { joined: 14, left: 3, topPost: { messageId: 120, reactions: 31 } },
    { joined: 6, left: 1, topPost: { messageId: 87, reactions: 12 } },
    { joined: 0, left: 2, topPost: null },
  ];
  await page.route('**/api/admin/channel-health', (route) =>
    route.fulfill({
      json: {
        channels: fixed.slice(0, week.length).map(({ chat, title }, index) => ({
          ...{ chat, title, subscribers: 1200 - index * 300, canPost: true, checkedAt: 1 },
          ...{ failed: 0, arrivals: 0, ...week[index] },
        })),
      },
    }),
  );
  const take = shot(page);
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await page.getByText(t('common.admin.management'), { exact: true }).click();
  await page.getByText(t('channels.title'), { exact: true }).click();
  await expect(page.getByText('@ch_shahrisabz · 1 ta joy')).toBeVisible();
  await take('1-list');
  await page.getByText(t('manage.channel.reactionsTitle')).scrollIntoViewIfNeeded();
  await expect(page.getByText(t('manage.channel.moves', { joined: '14', left: '3' }))).toBeVisible();
  await take('3-week');
  await page.getByText(t('channels.add')).click();
  await page.getByRole('textbox').nth(0).fill('ch_kitob');
  await page.getByRole('textbox').nth(1).fill('Kanal | Kitob');
  await page.getByText('Qashqadaryo viloyati', { exact: true }).click();
  await page.getByText('Kitob', { exact: true }).click();
  await page.getByText(t('channels.near')).click();
  await expect(page.getByText('Shahrisabz', { exact: true }).first()).toBeVisible();
  await take('2-new');
  await page.locator('#tg-main-button').click();
  await expect.poll(() => saved.length).toBe(1);
  expect(saved[0]).toMatchObject({ title: 'Kanal | Kitob' });
});
