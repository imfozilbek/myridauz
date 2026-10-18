import { createMarketClient } from '@platform/api-client';
import { tashkentDate } from '@platform/contracts';
import { expect, test } from '../crash-guard';
import { CHILONZOR, publishTrip } from './market-kit';
import { t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';
import { runCron, standRows, standSql } from './stand-tools';

// G49 (docs/77 P17, P18, docs/81 V11): the search of a passenger on the whole local Rida. The routes
// to Urganch and Termiz are this file's own: no other scenario of the stand goes there.
test.describe.configure({ mode: 'serial' });
const URGANCH = '1733401';
const TERMIZ = '1722401';
const LAYLO: Person = { id: 900908, name: 'Laylo', phone: '998901110908' };
const XURSHID: Person = { id: 900909, name: 'Xurshid', phone: '998901110909' };
const ILHOM: Person = { id: 900910, name: 'Ilhom', phone: '998901110910' };
// A holiday: the trips of a whole ordinary day of Rida on one route and one day (docs/61: 300 a day).
const HOLIDAY_TRIPS = 600;
const SEARCH_MS = 2_000;
const CRON_MS = 15_000;

test.beforeAll(() => register('passenger', LAYLO, 'female'));

test('P17. «Qayerga» of the main screen opens the list of «Qayerga» at once', async ({ page }) => {
  await openAs(page, 'passenger', LAYLO);
  await page.getByText(t('way.toEmpty')).click();
  await expect(page.getByText(t('find.other'))).toBeVisible();
});

test('P18. a route link of the landing opens the trips of the route at once', async ({ page }) => {
  await approvedDriver(XURSHID, '01G909XU');
  await publishTrip(XURSHID, CHILONZOR, URGANCH, 'door');
  await openAs(page, 'passenger', LAYLO, { search: `?tgWebAppStartParam=find_${CHILONZOR}_${URGANCH}` });
  await expect(page.locator('.search-trip').filter({ hasText: XURSHID.name })).toBeVisible();
});

// The trips are copies of one trip made in the database of the stand, as a holiday makes them.
function holiday(source: string, count: number) {
  const columns = standRows('PRAGMA table_info(trips)').map((row) => String(row['name']));
  const values = columns.map((name) => (name === 'id' ? `'v11-' || n.i` : `t.${name}`));
  standSql(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${count})
    INSERT INTO trips (${columns.join(', ')}) SELECT ${values.join(', ')} FROM n, trips t WHERE t.id = '${source}'`);
}

test('V11. a holiday: hundreds of trips on one day; the search finds them all at once, the Cron keeps up', async () => {
  await approvedDriver(ILHOM, '01G910IL');
  const trip = await publishTrip(ILHOM, CHILONZOR, TERMIZ, 'door', 3);
  holiday(trip.id, HOLIDAY_TRIPS);
  try {
    const market = createMarketClient(await signedAs('passenger', LAYLO));
    const date = tashkentDate(trip.departAt);
    const started = Date.now();
    const found = await market.searchTrips({ from: CHILONZOR, to: TERMIZ, date });
    expect(Date.now() - started).toBeLessThan(SEARCH_MS);
    expect(found).toHaveLength(HOLIDAY_TRIPS + 1);
    const cron = Date.now();
    await runCron();
    expect(Date.now() - cron).toBeLessThan(CRON_MS);
  } finally {
    standSql(`DELETE FROM trips WHERE id LIKE 'v11-%'`);
  }
});
