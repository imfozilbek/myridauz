import { expect, test, type Locator, type Page } from '../crash-guard';
import { TEXT } from '../apps';
import { CHILONZOR, publishTrip } from './market-kit';
import { DOSTON, GAYRAT } from './people';
import { mainButton, NARROW, openHome, PLATFORMS, t, type Platform } from './screen-tour';
import { register } from './seed';
import { backUntil } from './steps';
import { outsideCalls, type Person } from './stand-kit';

// A passenger looks for a trip (G59, docs/118 path 2): «Qayerga borasiz?», the place by «Boshqa joy»,
// the trips at once, «Safar», «Qayerdan, qayerga?», the booking waits; again by the last route; a day
// with no trip and its request. Every screen is shot on both platforms, every tap is counted.
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const SEEKERS: Record<Platform, Person> = {
  android: { id: 900793, name: 'Shoxista', phone: '998901110793' },
  ios: { id: 900794, name: 'Gulchehra', phone: '998901110794' },
};

// A route of this scenario only: no other scenario of the stand puts a trip on it (lesson 95).
const JIZZAX = '1708401';

test.beforeAll(async () => {
  await publishTrip(GAYRAT, CHILONZOR, JIZZAX, 'both');
  await publishTrip(DOSTON, CHILONZOR, JIZZAX, 'both');
  for (const person of Object.values(SEEKERS)) await register('passenger', person, 'female');
});

function shooter(page: Page, platform: Platform) {
  return async (name: string) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await page.screenshot({
      path: `screenshots/stand/passenger-search/${platform}/${name}.png`,
      animations: 'disabled',
    });
  };
}

// The map stands still and the name of the pin came: «Shu yerda» takes this place (lesson 77).
async function mapReady(page: Page, title: string) {
  await expect(page.getByText(t(title as 'way.point.from'))).toBeVisible();
  await expect(page.locator('[data-state="ready"]')).toBeVisible();
  // The name came and the map is inside the place (a center outside its border moves in, G35).
  await expect(page.getByRole('status')).not.toHaveText(/aniqlanmoqda|hududida emas/u, { timeout: 15_000 });
}

// The taps of the person: the goal counts them (docs/118: new ≤ 10, again ≤ 4, no trips ≤ 12).
function counter() {
  let count = 0;
  const tap = async (target: Locator) => {
    count += 1;
    await target.click();
  };
  return { tap, taps: () => count };
}

const card = (page: Page, driver: string) => page.locator('.search-trip').filter({ hasText: driver }).first();

for (const platform of PLATFORMS)
  test(`${platform}: the route → the trip → the seat asked; again by the last route`, async ({ page }) => {
    const shot = shooter(page, platform);
    const first = counter();
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await shot('01-home');
    await first.tap(mainButton(page).filter({ hasText: TEXT.findTrip }));
    await expect(page.getByText(t('find.title'))).toBeVisible();
    await shot('02-directions');
    await first.tap(page.getByText(t('find.other')));
    await page.getByPlaceholder(t('find.other')).fill('Jizz');
    await shot('03-other-place');
    await first.tap(page.getByRole('dialog').getByText('Jizzax', { exact: true }));
    await expect(card(page, GAYRAT.name)).toBeVisible();
    await shot('04-results');
    await first.tap(card(page, GAYRAT.name));
    await expect(mainButton(page)).toHaveText(TEXT.book);
    await shot('05-trip');
    await first.tap(mainButton(page));
    await expect(page.getByText(t('bookings.points.title'))).toBeVisible();
    await shot('06-points');
    await first.tap(page.getByText(t('way.book.pickup')));
    await mapReady(page, 'way.point.from');
    await shot('07-pickup');
    await first.tap(mainButton(page));
    await first.tap(page.getByText(t('way.book.dropoff')));
    await mapReady(page, 'way.point.to');
    await shot('08-dropoff');
    await first.tap(mainButton(page));
    await expect(page.getByText(t('bookings.points.all'))).toBeVisible();
    await shot('09-review');
    await first.tap(mainButton(page));
    await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
    await shot('10-sent');
    expect(first.taps()).toBeLessThanOrEqual(10);
    // Again: the last route on the main screen, the points of the last trip (K4, K5).
    const again = counter();
    // «Назад» up to the main screen: the app keeps its screen while it stays open.
    const recent = page.getByText(t('home.driver.last'));
    await backUntil(page, recent);
    await shot('11-home-again');
    await again.tap(page.getByText(/→ Jizzax$/u).last());
    await again.tap(card(page, DOSTON.name));
    await again.tap(mainButton(page));
    await expect(page.getByText(t('way.change')).first()).toBeVisible();
    await shot('12-review-kept');
    await again.tap(mainButton(page));
    await expect(page.getByText(t('bookings.status.requested')).first()).toBeVisible();
    expect(again.taps()).toBeLessThanOrEqual(4);
  });

for (const platform of PLATFORMS)
  test(`${platform}: no trip that day → «Soʻrov qoldirish» → the request left`, async ({ page }) => {
    const shot = shooter(page, platform);
    const person = counter();
    await openHome(page, 'passenger', SEEKERS[platform], platform);
    await person.tap(mainButton(page).filter({ hasText: TEXT.findTrip }));
    await person.tap(page.getByText(t('find.other')));
    await page.getByPlaceholder(t('find.other')).fill('Urga');
    await person.tap(page.getByRole('dialog').getByText('Urganch shahri', { exact: true }));
    await expect(page.getByText(t('find.noTrips'))).toBeVisible();
    await shot('20-empty');
    // The route and the day of the search go into the request (K6).
    await person.tap(page.getByText(t('common.passenger.leaveRequest')));
    const door = page.getByText(t('way.mode.door'), { exact: true });
    await expect(door.or(page.getByText(t('way.point.from')))).toBeVisible();
    if (await door.isVisible()) {
      await shot('21-mode');
      await person.tap(door);
    }
    await mapReady(page, 'way.point.from');
    await shot('22-pickup');
    await person.tap(mainButton(page));
    await mapReady(page, 'way.point.to');
    await shot('23-dropoff');
    await person.tap(mainButton(page));
    await expect(page.getByText(t('market.price.title'))).toBeVisible();
    await shot('24-price');
    await person.tap(mainButton(page));
    await expect(mainButton(page)).toHaveText(t('market.request.publish'));
    await shot('25-review');
    await person.tap(mainButton(page));
    await expect(mainButton(page)).toHaveText(t('market.done'));
    await shot('26-done');
    expect(person.taps()).toBeLessThanOrEqual(12);
  });
