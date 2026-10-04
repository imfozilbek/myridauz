import { expect, test } from '../crash-guard';
import { TEXT } from '../apps';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { FERUZA, OYBEK } from './people';
import { mainButton, NARROW, openHome, PLATFORMS, shot, t, visit } from './screen-tour';
import { outsideCalls, type Person } from './stand-kit';

// The screens of a passenger (docs/77) for the UX review: the first visit, the main screen with a
// confirmed and a waiting seat, and every screen one step from it.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const NEWCOMER: Person = { id: 900502, name: 'Gulchehra', phone: '998901110502' };

test.beforeAll(async () => {
  await confirmedSeat(OYBEK, FERUZA);
  const trip = await publishTrip(OYBEK, CHILONZOR, SAMARQAND, 'door');
  await book(FERUZA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
});

test('the first visit: the welcome with the documents, «Siz haqingizda»', async ({ page }) => {
  await openHome(page, 'passenger', NEWCOMER, 'android');
  await expect(page.getByText(TEXT.offerLink)).toBeVisible();
  await shot(page, 'android', 'p01-welcome');
  await mainButton(page).click();
  await expect(page.getByText(TEXT.about)).toBeVisible();
  await shot(page, 'android', 'p02-about');
});

for (const platform of PLATFORMS)
  test(`${platform}: the main screen and one step from it`, async ({ page }) => {
    await openHome(page, 'passenger', FERUZA, platform);
    await shot(page, platform, 'p10-home');
    await visit(page, platform, t('account.profile.open'), 'p11-profile');
    await visit(page, platform, t('common.myTrips'), 'p12-my-trips');
    await visit(page, platform, t('common.passenger.leaveRequest'), 'p13-request', t('places.toTitle'));
  });
