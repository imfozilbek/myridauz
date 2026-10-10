import { expect, test } from '../crash-guard';
import { TEXT, publishButton } from '../apps';
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
  // After the registration the main screen with the card of the application (G34).
  await openHome(page, 'driver', NEWCOMER, 'android');
  await applyAsDriver(page, (name) => shot(page, 'android', `d2${name}`));
});

test('T15, T11, D07. the team approves in the admin Mini App; the driver can publish', async ({ page }) => {
  await openHome(page, 'admin', OWNER, 'android');
  // The application waits in «Navbat» of the main screen (G75, mockup g67/1); the owner sees 4 cases
  // there, the filter «Arizalar» shows the applications.
  await page.getByRole('radio', { name: new RegExp(t('team.filter.application'), 'u') }).click();
  await page
    .getByText(t('team.case.application', { name: NEWCOMER.name }))
    .first()
    .click();
  await shot(page, 'android', 't20-application');
  await mainButton(page).filter({ hasText: TEXT.approve }).click();
  await mainButton(page).filter({ hasText: TEXT.plateMatches }).click();
  await expect(page.getByText(TEXT.decided).first()).toBeVisible();
  // The driver opens the app on the own phone.
  const phone = await page.context().newPage();
  await openHome(phone, 'driver', NEWCOMER, 'android');
  await expect(publishButton(phone)).toBeVisible();
  await shot(phone, 'android', 'd30-approved-home');
});
