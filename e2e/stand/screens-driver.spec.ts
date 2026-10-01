import { expect, test } from '@playwright/test';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { askRide, confirmedSeat, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { MALIKA, OYBEK, SEVARA } from './people';
import { mainButton, NARROW, openHome, PLATFORMS, shot, t, visit } from './screen-tour';
import { outsideCalls, type Person } from './stand-kit';

// The screens of a driver (docs/78) for the UX review: a newcomer, and an approved driver with a
// confirmed seat, a waiting request of a seat and a request of a passenger on the route.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const NEWCOMER: Person = { id: 900503, name: 'Sherzod', phone: '998901110503' };

test.beforeAll(async () => {
  await confirmedSeat(OYBEK, MALIKA);
  const trip = await publishTrip(OYBEK, CHILONZOR, SAMARQAND, 'door');
  await book(SEVARA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  await askRide(MALIKA);
});

test('a newcomer: welcome and the way to become a driver', async ({ page }) => {
  await openHome(page, 'driver', NEWCOMER, 'android');
  await shot(page, 'android', 'd01-welcome');
  await mainButton(page).click();
  await shot(page, 'android', 'd02-consent');
});

for (const platform of PLATFORMS)
  test(`${platform}: the main screen and one step from it`, async ({ page }) => {
    await openHome(page, 'driver', OYBEK, platform);
    await shot(page, platform, 'd10-home');
    await visit(page, platform, t('account.profile.open'), 'd11-profile');
    await visit(page, platform, t('common.myTrips'), 'd12-my-trips');
    await visit(page, platform, t('common.driver.passengerRequests'), 'd13-requests');
  });
