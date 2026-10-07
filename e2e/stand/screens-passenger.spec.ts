import { expect, test } from '../crash-guard';
import { TEXT } from '../apps';
import { passConsent } from '../registration';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { confirmedSeat, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { FERUZA, OYBEK } from './people';
import { NARROW, openHome, PLATFORMS, shot, t, visit, type Platform } from './screen-tour';
import { outsideCalls, type Person } from './stand-kit';

// The screens of a passenger (docs/77) for the UX review: the first visit, the main screen with a
// confirmed and a waiting seat, and every screen one step from it.
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const NEWCOMERS: Record<Platform, Person> = {
  android: { id: 900502, name: 'Gulchehra', phone: '998901110502' },
  ios: { id: 900504, name: 'Madina', phone: '998901110504' },
};

test.beforeAll(async () => {
  await confirmedSeat(OYBEK, FERUZA);
  const trip = await publishTrip(OYBEK, CHILONZOR, SAMARQAND, 'door');
  await book(FERUZA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
});

for (const platform of PLATFORMS)
  test(`${platform}: the first visit: the welcome with the documents, «Siz haqingizda»`, async ({ page }) => {
    await openHome(page, 'passenger', NEWCOMERS[platform], platform);
    await expect(page.getByText(TEXT.offerLink)).toBeVisible();
    await shot(page, platform, 'p01-welcome');
    await passConsent(page);
    await shot(page, platform, 'p02-about');
  });

for (const platform of PLATFORMS)
  test(`${platform}: the main screen and one step from it`, async ({ page }) => {
    await openHome(page, 'passenger', FERUZA, platform);
    await shot(page, platform, 'p10-home');
    await visit(page, platform, FERUZA.name, 'p11-profile');
    await visit(page, platform, t('common.myTrips'), 'p12-my-trips');
    await visit(page, platform, t('common.passenger.leaveRequest'), 'p13-request', t('places.toTitle'));
  });
