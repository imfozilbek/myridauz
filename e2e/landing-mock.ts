import type { Page } from '@playwright/test';

// The public prices of the API (docs/59): the start prices from Toshkent of docs/16.
const DIRECTIONS = [
  ['1727401', 35, 30_000],
  ['1724401', 120, 35_000],
  ['1708401', 200, 60_000],
  ['1714401', 290, 85_000],
  ['1718401', 300, 90_000],
  ['1730401', 320, 95_000],
  ['1703401', 350, 105_000],
  ['1712401', 465, 140_000],
  ['1710401', 490, 145_000],
  ['1706401', 570, 170_000],
  ['1722401', 700, 210_000],
  ['1733401', 1000, 300_000],
  ['1735401', 1150, 345_000],
] as const;

// The public price of a pair: from Toshkent the prices of docs/16, between regions the same formula.
export async function mockPrices(page: Page) {
  await page.route('**/public/price?*', (route) => {
    const url = new URL(route.request().url());
    const [from, to] = [url.searchParams.get('from') ?? '', url.searchParams.get('to') ?? ''];
    const [, km = 0, price = 0] = DIRECTIONS.find(([place]) => place === to || place === from) ?? [];
    return route.fulfill({ json: { from, to, km, price }, headers: { 'access-control-allow-origin': '*' } });
  });
}
