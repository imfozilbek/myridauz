import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { test } from './crash-guard';
import { mockManagement } from './g67-cases-mock';
import { mockTeamWaitlist } from './g83-team-mock';
import { mockTeam } from './team-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of the team screens of G83 (lessons 141, 147): «Boshqaruv» with «Kutish roʻyxati»,
// «Statistika» with «Kutayotganlar» and its «gold», a direction, the ad links; at the size of the
// phones of goals/g83/approved 5 … 8 (360 × 760).
const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const OUT = 'screenshots/pixel-g83';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
const tap = (page: Page, text: string) => page.getByText(text, { exact: true }).first().click();
async function management(page: Page, open = true) {
  await mockApi(page, 'active');
  await mockTelegram(page);
  await mockTeam(page, 'owner');
  await mockManagement(page);
  await mockTeamWaitlist(page, open);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
  await tap(page, t('common.admin.management'));
  await page.getByText(t('waitlistTeam.group')).waitFor();
  await page.waitForLoadState('networkidle');
}

test('«Boshqaruv»: the switch on, its sheet, the switch off', async ({ page }) => {
  await management(page);
  await shot(page, 't8-1-manage');
  await page.getByRole('checkbox', { name: t('waitlistTeam.switch') }).click({ force: true });
  await page.getByText(t('waitlistTeam.closeAsk')).waitFor();
  await shot(page, 't8-2-close');
});

test('«Boshqaruv» with the list closed', async ({ page }) => {
  await management(page, false);
  await shot(page, 't8-3-closed');
});

test('«Statistika»: «Kutayotganlar», the funnels, the gold, a direction and its sheet', async ({ page }) => {
  await management(page);
  await tap(page, t('common.admin.statistics'));
  await page.getByText(t('waitlistTeam.waiting')).waitFor();
  await page.waitForLoadState('networkidle');
  await shot(page, 't5-1-stats');
  await tap(page, 'Toshkent shahri ↔ Samarqand viloyati');
  await page.getByText(t('waitlistTeam.approved')).waitFor();
  await shot(page, 't5-2-direction');
  await page.locator('#tg-main-button').click();
  await page.getByText(t('waitlistTeam.openAsk')).waitFor();
  await shot(page, 't5-3-open');
});

test('«Reklama havolalari»: the list, a new link, the channel, ready, one link', async ({ page }) => {
  await management(page);
  await tap(page, t('ads.title'));
  await page.getByText('Toshkent eʼlonlari').waitFor();
  await shot(page, 't7-1-ads');
  await tap(page, 'Toshkent eʼlonlari');
  await page.getByText(t('ads.perListed')).waitFor();
  await shot(page, 't7-4-one');
});
