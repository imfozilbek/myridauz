import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { adminCase, appUrl, MINI_APPS } from './apps';
import { expect, test } from './crash-guard';
import { mockCases, mockManagement } from './g67-cases-mock';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';
import { id, mockTeam } from './team-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;

async function open(page: Page, width: number, url: string) {
  await page.setViewportSize({ width, height: HEIGHT });
  await mockApi(page, 'active');
  await mockTelegram(page);
  await mockTeam(page, 'owner');
  await mockCases(page);
  await mockManagement(page);
  await page.goto(telegramUrl(url));
}

const shot = (page: Page, name: string, width: number) =>
  page.screenshot({ path: `screenshots/look/g67-${name}-${width}.png`, fullPage: true });

// docs/121 on narrow and wide phones (G75, mockups g67/1 and g67/2): the main screen of the team, the
// cases and «Boshqaruv»; nothing is cut, the icon tiles of the rows are of one size.
for (const width of WIDTHS) {
  test(`${width}px: the main screen of the team fits`, async ({ page }) => {
    await open(page, width, appUrl(ADMIN.port));
    await expect(page.getByText(t('team.section.navbat'), { exact: true })).toBeVisible();
    await nothingCut(page);
    await oneSize(page, '.navbat-icon');
    await shot(page, 'home', width);
    await page.getByText(t('common.admin.management'), { exact: true }).click();
    await expect(page.getByText(t('manage.ownerOnly'))).toBeVisible();
    await nothingCut(page);
    await oneSize(page, '.manage-row .navbat-icon');
    await shot(page, 'boshqaruv', width);
  });

  for (const [name, query] of [
    ['application', `application=${id(2)}`],
    ['complaint', 'complaint=c1'],
  ] as const)
    test(`${width}px: the case «${name}» fits`, async ({ page }) => {
      await open(page, width, adminCase(query));
      await expect(page.locator('.case-title')).toBeVisible();
      await nothingCut(page);
      await shot(page, name, width);
    });

  test(`${width}px: the face photo fits`, async ({ page }) => {
    await open(page, width, appUrl(ADMIN.port));
    await page.getByText(t('team.case.face', { name: 'Madina' })).click();
    await expect(page.getByText(t('navbat.face.title'))).toBeVisible();
    await nothingCut(page);
    await shot(page, 'face', width);
  });
}
