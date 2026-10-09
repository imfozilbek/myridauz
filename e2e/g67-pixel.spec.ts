import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { expect, test } from './crash-guard';
import { mockTeam, type TeamRole } from './team-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect of the main screen of the team (G75, lessons 141, 147): the phones «Egasi» and
// «Moderator» of g67/1 at the size and scale of the mockup (360 × 760 at 1.5) with its data; the
// diff is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const [, , ADMIN] = MINI_APPS;
const OUT = 'screenshots/pixel-g67';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });

for (const [n, role] of [
  ['1', 'owner'],
  ['2', 'moderator'],
] as const satisfies readonly (readonly [string, TeamRole])[]) {
  test(`1-${n}: the main screen of the ${role}`, async ({ page }) => {
    await mockApi(page, 'active');
    await mockTelegram(page);
    await mockTeam(page, role);
    await page.goto(telegramUrl(appUrl(ADMIN.port)));
    await expect(page.getByText(t('team.section.navbat'), { exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUT}/1-${n}-code.png`, animations: 'disabled' });
  });
}
