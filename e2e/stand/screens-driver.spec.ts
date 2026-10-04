import { expect, test } from '../crash-guard';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { askRide, confirmedSeat, dayAfterTomorrow, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { MALIKA, OYBEK, ROZA } from './people';
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
  await book(ROZA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  // Roza asks for tomorrow in driver-account: here another day (G37, docs/101 R5).
  await askRide(ROZA, dayAfterTomorrow());
});

test('a newcomer: welcome and the way to become a driver', async ({ page }) => {
  await openHome(page, 'driver', NEWCOMER, 'android');
  await shot(page, 'android', 'd01-welcome');
  await mainButton(page).click();
  await shot(page, 'android', 'd02-about');
});

for (const platform of PLATFORMS)
  test(`${platform}: the main screen and one step from it`, async ({ page }) => {
    await openHome(page, 'driver', OYBEK, platform);
    await shot(page, platform, 'd10-home');
    await visit(page, platform, OYBEK.name, 'd11-profile');
    await visit(page, platform, t('common.myTrips'), 'd12-my-trips');
    await visit(page, platform, t('common.driver.passengerRequests'), 'd13-requests');
  });
