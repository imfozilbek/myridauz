import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Page } from '@playwright/test';
import { openMockupProfile, type Role } from './g65-profile-mock';
import { request, tripOf } from './market-mock';

// «Kanallar» of the mockups 7-channels-2 (passenger) and 7-channels-3 (driver), one to one: the person
// is in the channel of Samarqand; «Siz uchun» comes from what the app knows of the person (docs/119).
const { t } = createI18n(DEFAULT_LOCALE);
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const FARGONA = '1730401';
const BUXORO = '1706401';
const QARSHI = '1710401';

const toFargona = (n: string) => ({ ...request, id: `${request.id}${n}`, to: FARGONA });

// A passenger rode twice to Samarqand (the history of the mocks), asks a seat to Fargʻona and searched
// Buxoro last.
async function passenger(page: Page) {
  await page.route('**/api/passenger/requests', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { requests: [toFargona('0')] } })
      : route.fallback(),
  );
  await page.addInitScript(
    (recent) => localStorage.setItem('route_recent', JSON.stringify(recent)),
    [{ from: CHILONZOR, to: BUXORO }],
  );
}

// A driver drove twice to Samarqand, the last trip went to Qarshi, two passengers ask Fargʻona.
async function driver(page: Page) {
  const trips = [
    tripOf('7', 'Murod', false, -72),
    tripOf('8', 'Murod', false, -48),
    tripOf('9', 'Murod', false, -24, { to: QARSHI }),
  ];
  await page.route('**/api/driver/trips', (route) => route.fulfill({ json: { trips } }));
  await page.route('**/api/driver/requests/board*', (route) =>
    route.fulfill({
      json: {
        known: true,
        date: request.date,
        days: [],
        carSeats: 4,
        trip: null,
        fits: [],
        others: [toFargona('1'), toFargona('2')],
      },
    }),
  );
}

export async function openMockupChannels(page: Page, role: Role) {
  const zones = loadBrand().channels;
  const samarqand = zones.find((zone) => zone.places.includes(SAMARQAND));
  const channels = zones.map((zone) => ({ username: zone.username, member: zone === samarqand }));
  await openMockupProfile(page, role, channels, () => (role === 'driver' ? driver(page) : passenger(page)));
  await page.getByText(t('channels.title'), { exact: true }).click();
  await page.getByText(t('channels.mine.forYou')).waitFor();
}
