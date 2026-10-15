import { type Page } from '@playwright/test';
import { test } from './crash-guard';
import { appUrl, WAITLIST_PORT } from './apps';
import { mockWaitlist, samarqand } from './g83-waitlist-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// Pixel Perfect of G83 (lessons 141, 147, docs/181): the questionnaire of the main bot shot at the size
// of the mockup phones of goals/g83/approved (360 × 760); the diff is read by scripts/pixel-diff.py.
const OUT = 'screenshots/pixel-g83';
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
  await page.getByText('Yoʻlovchiman').waitFor();
  await shot(page, 'p03-role');
  await tap(page, /^Yoʻlovchiman/u);
  for (const pain of [/Telegram guruhlaridagi/u, /Shaxsiy raqam/u])
    await page.getByRole('checkbox', { name: pain }).click();
  await shot(page, 'p04-pains');
  await page.locator('#tg-main-button').click();
  await page.getByText('Qaysi viloyatdansiz?').waitFor();
  await shot(page, 'p05-home');
  await tap(page, 'Toshkent shahri');
  await page.getByText('Qaysi viloyatga qatnaysiz?').waitFor();
  await tap(page, 'Samarqand viloyati');
  await shot(page, 'p07-when');
  // Back on the question of the region: Samarqand chosen, the line from Toshkent shahri (mockup 5).
  await pressBack(page);
  await page.getByText('Qaysi viloyatga qatnaysiz?').waitFor();
  await shot(page, 'p06-city');
  await tap(page, 'Samarqand viloyati');
  await tap(page, 'Har hafta');
  await page.getByText('Yoʻnalishingiz kanallari').waitFor();
  await shot(page, 'p08-channels');
});

test('passenger: the result and «Oʻzgartirish»', async ({ page }) => {
  await open(page, [['passenger', ['chats', 'phone'], 'weekly']]);
  await page.getByText('Siz roʻyxatdasiz').waitFor();
  await shot(page, 'p09-result');
  await tap(page, 'Oʻzgartirish');
  await page.getByText('Muammolar').waitFor();
  await shot(page, 'p15-edit');
});

test('passenger: fewer than 10 people wait', async ({ page }) => {
  await open(page, [['passenger', ['woman', 'price'], 'once', true]]);
  await page.getByText('Siz roʻyxatdasiz').waitFor();
  await shot(page, 'p14-few');
});

test('driver: pains, region, «Qachon», the result', async ({ page }) => {
  await open(page);
  await tap(page, /^Haydovchiman/u);
  for (const pain of [/Guruhlarda tartibsizlik/u, /Qatʼiy narxlar/u])
    await page.getByRole('checkbox', { name: pain }).click();
  await shot(page, 'd04-pains');
  await page.locator('#tg-main-button').click();
  await tap(page, 'Samarqand viloyati');
  await shot(page, 'd07-when');
  await tap(page, 'Har hafta');
  await page.getByText('Yoʻnalishingiz kanallari').waitFor();
  await shot(page, 'd08-channels');
  await page.locator('#tg-main-button').click();
  await page.getByText('Siz roʻyxatdasiz').waitFor();
  await shot(page, 'd09-result');
});
