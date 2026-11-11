import { loadBrand } from '@platform/brands';
import { helpValues } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openMockupWallet } from './g65-wallet-mock';
import { openDriverShot } from './g76-driver-mock';
import { openPassengerShot } from './g76-passenger-mock';

// The mockup of G97 (docs/226): «Yordam» of the Mini Apps from the real screens at the size of the
// phones of the mockups (360 × 760 at 2). The shots are the mockup and its Pixel Perfect. The chat of
// the bot (6, 7) is shot on the stand (e2e/stand/g97.spec.ts): it needs the brand kit (lesson 388).
const { t, formatMoney } = createI18n(DEFAULT_LOCALE);
const values = helpValues(loadBrand(), formatMoney);
const OUT = 'screenshots/pixel-g97';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 });

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
}

const openHelp = async (page: Page) => {
  await page.getByText(t('home.support'), { exact: true }).click();
  await expect(page.getByText(t('help.lead'))).toBeVisible();
};

test('1 … 3: a passenger opens «Yordam», a topic and an answer', async ({ page }) => {
  await openPassengerShot(page, 2);
  await openHelp(page);
  await shot(page, '1-topics');
  await page.getByText(t('help.topic.booking'), { exact: true }).click();
  await shot(page, '2-topic');
  await page.getByText(t('help.booking.wait.q', values)).click();
  await expect(page.getByText(t('help.more'))).toBeVisible();
  await shot(page, '3-answer');
});

test('4: a driver sees the topics of a driver first', async ({ page }) => {
  await openDriverShot(page, 2);
  await openHelp(page);
  await shot(page, '4-driver-topics');
});

test('5: «Hamyon» ends with the questions of its topic', async ({ page }) => {
  await openMockupWallet(page);
  const link = page.getByText(t('help.link', { topic: t('help.topic.wallet') }));
  await link.scrollIntoViewIfNeeded();
  await shot(page, '5-wallet');
});
