import { expect, test } from '@playwright/test';
import { TEXT } from '../apps';
import { applyAsDriver } from '../driver-application';
import { OWNER } from './people';
import { mainButton, NARROW, openHome, shot, t } from './screen-tour';
import { register } from './seed';
import { outsideCalls, type Person } from './stand-kit';

// The way to become a driver on the whole local Rida (docs/78 D01, D03, D05, D06, D07, docs/79 T11,
// T15, T17): every screen of the application, the check by the team in the admin Mini App, the
// approved driver. Android at 360 px (lesson 52).
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const NEWCOMER: Person = { id: 900606, name: 'Hamid', phone: '998901110606' };

test('D01, D03, D05, D06. the application screen by screen, then «on the check»', async ({ page }) => {
  await register('driver', NEWCOMER, 'male');
  await openHome(page, 'driver', NEWCOMER, 'android');
  await page
    .getByText(TEXT.becomeDriver)
    .first()
    .click()
    .catch(() => undefined);
  await applyAsDriver(page, (name) => shot(page, 'android', `d2${name}`));
});

test('T15, T11, D07. the team approves in the admin Mini App; the driver can publish', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  await page.getByText(t('common.admin.applications')).first().click();
  await page.getByText(NEWCOMER.name).first().click();
  await shot(page, 'android', 't20-application');
  await page.getByText(TEXT.approve).click();
  await mainButton(page).filter({ hasText: TEXT.plateMatches }).click();
  await expect(page.getByText(TEXT.decided).first()).toBeVisible();
  // The driver opens the app on the own phone.
  const phone = await page.context().newPage();
  await openHome(phone, 'driver', NEWCOMER, 'android');
  await expect(mainButton(phone)).toHaveText(TEXT.newTrip);
  await shot(phone, 'android', 'd30-approved-home');
});
