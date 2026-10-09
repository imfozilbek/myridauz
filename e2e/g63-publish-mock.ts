import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect } from './crash-guard';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS, publishButton, TEXT } from './apps';
import { mapState, mockMap } from './map-mock';
import { TILES_MS } from './map-wait';
import { chooseRoute } from './market';
import { PITAK } from './market-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [, DRIVER] = MINI_APPS;
// A man drives: «Mashinada ayol bor» is his question when he takes fewer people (docs/06).
const MAN = {
  id: '00000000000000000000000000000001',
  firstName: 'Jasur',
  gender: 'male',
  phone: '+998901234567',
  roles: ['passenger', 'driver'],
  hasAvatar: true,
  writeAccess: true,
  joinedAt: Date.parse('2026-08-09T00:00:00Z'),
  rating: null,
  avatarStatus: null,
  avatarReason: null,
};

// «Safar eʼlon qilish» as the mockups g63/1 and g63/2 show it (G63): a Cobalt of 4 seats, Chilonzor
// to Samarqand shahri tomorrow at 08:00 for 90 000 a seat, seats or the whole car.
export async function openPublish(page: Page) {
  await mockApi(page, 'active');
  await mockMap(page, mapState());
  // The pitak stands on the piece of the map the tests have: its small map shows streets.
  const pitak = { ...PITAK, point: { lat: 41.3113, lng: 69.2795 } };
  await page.route('**/api/pitaks/direction?*', (route) => route.fulfill({ json: { pitak } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: { state: 'active', profile: MAN } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(DRIVER.port)));
  const main = page.locator('#tg-main-button');
  await publishButton(page).click();
  await chooseRoute(page);
  await page.getByText(/^(Bugun|Ertaga), \d\d:\d\d$/u).click();
  await page.getByText(t('market.day.tomorrow'), { exact: true }).click();
  await main.click();
  await page.getByText(t('market.rule.title')).click();
  await page.getByText(t('market.rule.seatsOrCar')).click();
  await main.click();
  await expect(main).toHaveText(TEXT.publish);
  await expect(
    page.getByText(t('market.publish.day', { date: t('market.day.tomorrow'), time: '08:00' })),
  ).toBeVisible();
  await page.mouse.move(0, 0);
}

// Three seats of four: «Mashinada ayol bor» comes right under them, switched on (mockup g63/1, 2).
export async function fewerSeatsWithWoman(page: Page) {
  await page.getByLabel(t('market.price.less')).first().click();
  // The whole row is the label of its switch.
  await page.getByText(t('market.search.woman'), { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: t('market.search.woman') })).toBeChecked();
  await page.mouse.move(0, 0);
}

// The pitak of the direction on the small map under its card (docs/126, journey g63/4 screen 3).
export async function pitakOnMap(page: Page) {
  await expect(page.locator('.meeting-map-box[data-state="ready"]')).toBeVisible();
  await page.waitForTimeout(TILES_MS);
  await page.mouse.move(0, 0);
}
