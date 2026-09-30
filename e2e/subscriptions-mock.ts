import type { Page, Route } from '@playwright/test';
import { tripOf } from './market-mock';

// Route subscriptions as the Mini Apps see them (G10): the search finds nothing, "Xabar bering".
const CHILONZOR = '1726269';
const DAY = 24 * 3_600_000;
export const LINKED = tripOf('5', 'Jasur', true, 30);

export async function mockSubscriptions(page: Page, emptySearch: boolean) {
  const list: object[] = [
    {
      id: 's0',
      kind: 'trips',
      from: CHILONZOR,
      to: '1730',
      date: null,
      woman: true,
      expiresAt: Date.now() - DAY,
      expired: true,
    },
  ];
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  const handle = (kind: 'trips' | 'requests') => async (route: Route) => {
    if (route.request().method() === 'GET')
      return json(route, { subscriptions: list.filter((s) => (s as { kind: string }).kind === kind) });
    const input = route.request().postDataJSON() as { date: string | null };
    const created = {
      ...input,
      id: `s${list.length}`,
      kind,
      expiresAt: Date.now() + 30 * DAY,
      expired: false,
    };
    list.unshift(created);
    return json(route, created, 201);
  };
  await page.route('**/api/passenger/subscriptions', handle('trips'));
  await page.route('**/api/driver/subscriptions', handle('requests'));
  await page.route('**/api/*/subscriptions/*/renew', (route) => json(route, { ...list[0], expired: false }));
  // "Band qilish" in a channel opens this trip (docs/15).
  await page.route(`**/api/trips/${LINKED.id}`, (route) => json(route, LINKED));
  if (!emptySearch) return;
  await page.route('**/api/trips?*', (route) => json(route, { trips: [] }));
  await page.route('**/api/driver/requests?*', (route) => json(route, { requests: [] }));
}
