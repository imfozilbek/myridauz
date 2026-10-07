import type { Page } from '@playwright/test';
import { test } from './crash-guard';
import { openMyRequest, openRequestScreen } from './g61-mock';
import { openRuleStep } from './g61-rule-mock';

// Pixel Perfect of G61 (lessons 141, 147, docs/137): the request and «Mening soʻrovim» shot at the
// size of the mockups (360 × 759) with their data; the diff is read by scripts/pixel-diff.py.
const OUT = 'screenshots/pixel-g61';
test.use({ viewport: { width: 360, height: 759 }, deviceScaleFactor: 1 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

test('«Soʻrov» against the mockup', async ({ page }) => {
  await openRequestScreen(page);
  await shot(page, '01');
});

test('«Mening soʻrovim» against the mockup', async ({ page }) => {
  await openMyRequest(page);
  await shot(page, '03');
});

test('«Qanday band qilinadi?» against the mockup', async ({ page }) => {
  await openRuleStep(page);
  await shot(page, '02');
});
