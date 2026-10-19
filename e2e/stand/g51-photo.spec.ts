import type { Page } from '@playwright/test';
import { TEXT } from '../apps';
import { afterSplash, expect, test } from '../crash-guard';
import { passConsent } from '../registration';
import { press } from './bot-kit';
import { OWNER } from './people';
import { mainButton, NARROW, openHome, t } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';
import { standRows } from './stand-tools';

// G51 on the whole local Rida: a passenger registers and uses Rida without a photo, the photo is
// optional in the profile, a refused photo says why (owner decision 19.10.2026, docs/77 P83, P84).
// Each screen is shot for the owner (docs/33) into screenshots/stand/g51/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g51';
const NEWCOMER: Person = { id: 900491, name: 'Dilnoza', phone: '998901110491' };
const REFUSED: Person = { id: 900492, name: 'Gulshan', phone: '998901110492' };
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};

test('P83. a passenger registers without a photo; the profile says it is optional', async ({ page }) => {
  await openHome(page, 'passenger', NEWCOMER, 'android');
  await passConsent(page);
  await page.getByRole('radio', { name: TEXT.female }).click();
  await expect(page.getByText(TEXT.optionalPhoto)).toBeVisible();
  await expect(mainButton(page)).toBeEnabled();
  await shot(page, '1-about');
  await mainButton(page).click();
  await expect(mainButton(page).filter({ hasText: TEXT.findTrip })).toBeVisible();
  await page.getByLabel(TEXT.profile).click();
  await expect(page.getByText(t('account.avatar.addOptional'))).toBeVisible();
  await shot(page, '2-profile');
});

test('P84. a refused photo: the profile says why and asks for another one', async ({ page }) => {
  await register('passenger', REFUSED, 'female');
  const [row] = standRows(`SELECT avatar_at FROM users WHERE id = ${REFUSED.id}`);
  await press('admin', OWNER, `face:${REFUSED.id}:${Number(row?.['avatar_at']).toString(36)}:no:0`);
  await openHome(page, 'passenger', REFUSED, 'android');
  await page.getByLabel(TEXT.profile).click();
  const reason = t('moderation.faceReason.face_not_visible');
  await expect(page.getByText(t('account.avatar.rejected', { reason }))).toBeVisible();
  await shot(page, '3-profile-refused');
});
