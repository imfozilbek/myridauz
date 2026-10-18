import { createMarketClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { TRIP_LINK } from '@platform/contracts';
import { expect, test, type Page } from '../crash-guard';
import { openFindTrip, publishButton, TEXT } from '../apps';
import { openFromList } from '../market';
import { QARSHI } from './g64-kit';
import { CHILONZOR, publishTrip } from './market-kit';
import { fillEnds } from './request-kit';
import { mainButton, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';

// The steps of the flyer Qashqadaryo and Toshkent (brand kit, docs/38): the screens of the Mini Apps
// on the whole local Rida, the route Qarshi shahri → Toshkent, as people see them on a phone.
const SANJAR: Person = { id: 900771, name: 'Sanjar', phone: '998901110771' };
const OTABEK: Person = { id: 900772, name: 'Otabek', phone: '998901110772' };
const DILFUZA: Person = { id: 900775, name: 'Dilfuza', phone: '998901110775' };
const SCREENS = `brands/${loadBrand().id}/brand-kit/data/flyer-screens/qashqadaryo`;
// The screens go straight to the data of the flyer (pnpm flyer), only with --shots (e2e/crash-guard.ts):
// the photos of the regions and the people are in before the picture.
const shot = async (page: Page, name: string) => {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  );
  await page.screenshot({
    path: `${SCREENS}/${name}.jpg`,
    quality: 90,
    animations: 'disabled',
  });
};
const seen = (page: Page, text: string | RegExp) => expect(page.getByText(text).first()).toBeVisible();

test.use({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
test.setTimeout(240_000);

test.beforeAll(async () => {
  await approvedDriver(SANJAR, '70A771BC');
  await approvedDriver(OTABEK, '70A772BC');
  await register('passenger', DILFUZA, 'female');
});

async function qarshiToToshkent(page: Page) {
  await openFromList(page);
  await page.getByAltText('Qashqadaryo viloyati').click();
  await page.getByText('Qarshi shahri', { exact: true }).click();
  await page.getByAltText('Toshkent shahri').click();
  const chilonzor = page.getByText('Chilonzor', { exact: true });
  if (await chilonzor.isVisible().catch(() => false)) await chilonzor.click();
}

test('the steps of the flyer: a driver publishes, a passenger finds and books, the driver confirms', async ({
  page,
  context,
}) => {
  // A second trip on the same way: the list of trips is not empty of choice.
  await publishTrip(OTABEK, QARSHI, CHILONZOR, 'door', 0);
  await openAs(page, 'driver', SANJAR);
  await publishButton(page).click();
  await qarshiToToshkent(page);
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  await shot(page, 'driver-1');
  await mainButton(page).click();
  await seen(page, t('driverTrip.published.title'));
  const market = createMarketClient(await signedAs('driver', SANJAR));
  const [trip] = (await market.myTrips()).filter((item) => item.status === 'active');
  if (!trip) throw new Error('stand: no trip of Sanjar');

  const phone = await context.newPage();
  await openAs(phone, 'passenger', DILFUZA);
  await openFindTrip(phone);
  await phone.getByText(TEXT.change).first().click();
  await phone.getByAltText('Qashqadaryo viloyati').click();
  await phone.getByText('Qarshi shahri', { exact: true }).click();
  await seen(phone, t('find.title'));
  await shot(phone, 'passenger-1');
  await phone.getByText('Toshkent', { exact: false }).first().click();
  const chilonzor = phone.getByText('Chilonzor', { exact: true });
  if (await chilonzor.isVisible().catch(() => false)) await chilonzor.click();
  await seen(phone, SANJAR.name);
  await shot(phone, 'passenger-2');
  await phone.close();

  const booking = await context.newPage();
  await openAs(booking, 'passenger', DILFUZA, { search: `?tgWebAppStartParam=${TRIP_LINK}_${trip.id}` });
  await seen(booking, t('find.book', { count: '1' }));
  await shot(booking, 'passenger-3');
  await mainButton(booking)
    .filter({ hasText: t('find.book', { count: '1' }) })
    .click();
  await fillEnds(booking);
  await mainButton(booking).click();
  await seen(booking, t('bookings.status.requested'));
  await booking.close();

  await seen(page, t('driverTrip.asked', { count: '1' }));
  await shot(page, 'driver-2');
  await page.getByRole('button', { name: t('bookings.confirm'), exact: true }).click();
  await seen(page, t('driverTrip.passengers', { count: '1' }));
  await shot(page, 'driver-3');
});
