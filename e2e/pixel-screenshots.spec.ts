import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { addFace, passConsent } from './registration';
import { mockTelegram, telegramUrl } from './telegram-mock';

// Pixel Perfect (owner decision 06.10.2026, lesson 141): the approved mockup and the code are shot
// in one size, the diff is read from the two pictures (screenshots/pixel).
const PHONE = { width: 360, height: 760 };
const SOURCE = (name: string) => pathToFileURL(resolve(`docs/goals/g58/src/${name}.html`)).href;
const OUT = 'screenshots/pixel';
test.use({ viewport: PHONE, deviceScaleFactor: 2 });

async function mockup(page: Page, name: string, index: number, shot: string) {
  await page.goto(SOURCE(name));
  await page
    .locator('.ph')
    .nth(index)
    .screenshot({ path: `${OUT}/${shot}-mockup.png`, animations: 'disabled' });
}

const code = (page: Page, shot: string) =>
  page.screenshot({ path: `${OUT}/${shot}-code.png`, animations: 'disabled' });

for (const app of MINI_APPS.filter((item) => item.welcome))
  test(`${app.name}: the registration against the approved mockups`, async ({ page }) => {
    if (app.name === 'passenger') {
      await mockup(page, '1-welcome', 0, 'passenger-1-empty');
      await mockup(page, '1-welcome', 1, 'passenger-1');
      await mockup(page, '2-about-photo', 0, 'passenger-2-empty');
      await mockup(page, '2-about-photo', 1, 'passenger-2');
    }
    await mockApi(page, 'unregistered');
    await mockTelegram(page);
    await page.goto(telegramUrl(appUrl(app.port)));
    await expect(page.getByText(TEXT.offerLink)).toBeVisible();
    await code(page, `${app.name}-1-empty`);
    await passConsent(page, () => code(page, `${app.name}-1`));
    await page.getByRole('radio', { name: TEXT.female }).click();
    await code(page, `${app.name}-2-empty`);
    await addFace(page);
    await expect(page.getByText(TEXT.changePhoto)).toBeVisible();
    await code(page, `${app.name}-2`);
  });
