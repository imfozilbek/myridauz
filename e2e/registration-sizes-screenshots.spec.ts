import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, TEXT } from './apps';
import { addFace, passConsent } from './registration';
import { HEIGHT, nothingCut, oneSize, WIDTHS } from './sizes';
import { mockTelegram, telegramUrl } from './telegram-mock';

// docs/121: nothing is cut on narrow and wide phones, tiles of one kind are of one size (G58).

for (const app of MINI_APPS.filter((item) => item.welcome))
  for (const width of WIDTHS)
    test(`${app.name} ${width}px: both screens of the registration fit`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await mockApi(page, 'unregistered');
      await mockTelegram(page);
      await page.goto(telegramUrl(appUrl(app.port)));
      const shot = (name: string) =>
        page.screenshot({
          path: `screenshots/registration/${app.name}-${width}-${name}.png`,
          fullPage: true,
        });
      await expect(page.getByText(TEXT.offerLink)).toBeVisible();
      await nothingCut(page);
      await passConsent(page, () => shot('1-welcome'));
      await addFace(page);
      await page.getByRole('radio', { name: TEXT.female }).click();
      await expect(page.getByText(TEXT.changePhoto)).toBeVisible();
      await nothingCut(page);
      await oneSize(page, '[role="radio"]');
      await shot('2-about');
    });
