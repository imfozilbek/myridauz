import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { expect, test } from './crash-guard';
import { mockDecisions, MOCKUP_NOW } from './g95-mock';
import { mockTeam, type TeamRole } from './team-mock';
import { mockTelegram, pressBack, telegramUrl } from './telegram-mock';

// The screens of G95 (docs/224) at the size of the phones of the mockup (360 × 760 at 2): a moderator
// finds the application he approved by mistake and fixes the car by its photo, or sends it back;
// the owner opens a rejected one from «Jurnal». The shots are the mockup and its Pixel Perfect.
const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const OUT = 'screenshots/pixel-g95';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 });

async function openAs(page: Page, role: TeamRole) {
  await page.clock.setFixedTime(MOCKUP_NOW);
  await mockApi(page, 'active');
  await mockTelegram(page);
  await mockTeam(page, role);
  await mockDecisions(page);
  await page.goto(telegramUrl(appUrl(ADMIN.port)));
}

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
}

const mainButton = (page: Page) => page.locator('#tg-main-button');

test('1 … 5: a moderator finds his decision and fixes it', async ({ page }) => {
  await openAs(page, 'moderator');
  await expect(page.getByText(t('team.work.done'))).toBeVisible();
  await shot(page, '1-home');
  await page.getByText(t('team.work.done')).click();
  await expect(page.getByText(t('moderation.mine.title'))).toBeVisible();
  await shot(page, '2-mine');
  await page.getByText('Farhod', { exact: true }).click();
  await expect(mainButton(page)).toHaveText(t('moderation.fixCar'));
  await shot(page, '3-approved');
  await mainButton(page).click();
  await expect(page.getByText(t('moderation.fixCar.hint'))).toBeVisible();
  await page.getByRole('textbox').fill('01A777BC');
  await expect(mainButton(page)).toHaveText(t('moderation.fixCar.save'));
  await shot(page, '4-fix');
  await pressBack(page);
  await page.getByText(t('moderation.sendBack')).click();
  await page.getByText(t('drivers.reason.plate_not_readable')).click();
  await shot(page, '5-send-back');
});

test('6, 7: the owner opens a rejected application from «Jurnal»', async ({ page }) => {
  await openAs(page, 'owner');
  await page.getByText(t('common.admin.management')).click();
  await page.getByText(t('manage.journal'), { exact: true }).click();
  await expect(page.getByText(t('manage.entry.rejected'))).toBeVisible();
  await shot(page, '6-journal');
  await page.getByText(t('manage.entry.rejected')).click();
  await expect(mainButton(page)).toHaveText(t('moderation.reopen'));
  await shot(page, '7-rejected');
});
