import { loadBrand } from '@platform/brands';
import { expect, test } from '../crash-guard';
import { CHILONZOR, publishTrip } from './market-kit';
import { SAMARQAND } from './g27-kit';
import { mainButton, NARROW, openHome, shot } from './screen-tour';
import { approvedDriver } from './seed';
import type { Person } from './stand-kit';

// A new person from «Band qilish» of a channel post (G75, docs/124 Д): the trip first, the
// registration after its «Band qilish». The people of this file only.
test.use({ viewport: NARROW });
const DRIVER: Person = { id: 900861, name: 'Sanjar', phone: '998901110861' };
const NEWCOMER: Person = { id: 900862, name: 'Muslima', phone: '998901110862' };

test('a new person sees the trip of a link before the registration', async ({ page }) => {
  await approvedDriver(DRIVER, '01S795TU');
  const trip = await publishTrip(DRIVER, CHILONZOR, SAMARQAND, 'door');
  await openHome(page, 'passenger', NEWCOMER, 'android', `?tgWebAppStartParam=trip_${trip.id}`);
  await expect(page.getByText(DRIVER.name).first()).toBeVisible();
  await shot(page, 'android', 'p90-trip-before-registration');
  await mainButton(page).click();
  await expect(page.getByText(loadBrand().slogan).first()).toBeVisible();
});
