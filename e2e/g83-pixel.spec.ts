import { type Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE, toCyrillic } from '@platform/i18n';
import { test } from './crash-guard';
import { appUrl, WAITLIST_PORT } from './apps';
import { mockWaitlist, samarqand } from './g83-waitlist-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G83 (lessons 141, 147, docs/181): the questionnaire of the main bot shot at the size
// of the mockup phones of goals/g83/approved (360 × 760); the diff is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g83';
// The regions as the directory names them: in Cyrillic (G98).
const SAMARQAND = toCyrillic('Samarqand viloyati');
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
const tap = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first().click();
async function open(page: Page, entries: Parameters<typeof samarqand>[] = []) {
  await mockWaitlist(page, { entries: entries.map((args) => samarqand(...args)) });
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(WAITLIST_PORT)));
}

test('passenger: role, pains, region, Samarqand, «Qachon», channels', async ({ page }) => {
  await open(page);
  await page.getByText(t('waitlist.role.passenger')).waitFor();
  await shot(page, 'p03-role');
  await tap(page, new RegExp(`^${t('waitlist.role.passenger')}`, 'u'));
  for (const pain of [t('waitlist.pain.passenger.chats'), t('waitlist.pain.passenger.phone')])
    await page.getByRole('checkbox', { name: pain }).click();
  await shot(page, 'p04-pains');
  await page.locator('#tg-main-button').click();
  await page.getByText(t('waitlist.home.title')).waitFor();
  await shot(page, 'p05-home');
  await tap(page, toCyrillic('Toshkent shahri'));
  await page.getByText(t('waitlist.city.title')).waitFor();
  await tap(page, SAMARQAND);
  await shot(page, 'p07-when');
  // Back on the question of the region: Samarqand chosen, the line from Toshkent shahri (mockup 5).
  await pressBack(page);
  await page.getByText(t('waitlist.city.title')).waitFor();
  await shot(page, 'p06-city');
  await tap(page, SAMARQAND);
  await tap(page, t('waitlist.cadence.weekly'));
  await page.getByText(t('waitlist.channels.title')).waitFor();
  await shot(page, 'p08-channels');
});

test('passenger: the result and «Oʻzgartirish»', async ({ page }) => {
  await open(page, [['passenger', ['chats', 'phone'], 'weekly']]);
  await page.getByText(t('waitlist.done.title')).waitFor();
  await shot(page, 'p09-result');
  await tap(page, t('waitlist.done.change'));
  await page.getByText(t('waitlist.edit.pains')).waitFor();
  await shot(page, 'p15-edit');
});

test('passenger: fewer than 10 people wait', async ({ page }) => {
  await open(page, [['passenger', ['woman', 'price'], 'once', true]]);
  await page.getByText(t('waitlist.done.title')).waitFor();
  await shot(page, 'p14-few');
});

test('driver: pains, region, «Qachon», the result', async ({ page }) => {
  await open(page);
  await tap(page, new RegExp(`^${t('waitlist.role.driver')}`, 'u'));
  for (const pain of [t('waitlist.pain.driver.chats'), t('waitlist.pain.driver.fixed')])
    await page.getByRole('checkbox', { name: pain }).click();
  await shot(page, 'd04-pains');
  await page.locator('#tg-main-button').click();
  await tap(page, SAMARQAND);
  await shot(page, 'd07-when');
  await tap(page, t('waitlist.cadence.weekly'));
  await page.getByText(t('waitlist.channels.title')).waitFor();
  await shot(page, 'd08-channels');
  await page.locator('#tg-main-button').click();
  await page.getByText(t('waitlist.done.title')).waitFor();
  await shot(page, 'd09-result');
});
