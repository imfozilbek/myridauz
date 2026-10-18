import { createChatClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { confirmedSeat, TO_SAMARQAND } from './g27-kit';
import { answer, book } from './market-kit';
import { NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { standSql } from './stand-tools';

// G46 (docs/111) on the whole local Rida: the new screens of trust, each shot for the owner (docs/33)
// into screenshots/stand/g46/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g46';
const DRIVER: Person = { id: 900471, name: 'Rustam', phone: '998901110471' };
const MADINA: Person = { id: 900472, name: 'Madina', phone: '998901110472' };
const SHAHLO: Person = { id: 900473, name: 'Shahlo', phone: '998901110473' };
const MOTHER: Person = { id: 900474, name: 'Ona', phone: '998901110474' };
const REVIEWS = 22;
const DAY = 24 * 60 * 60 * 1000;
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
let tripId = '';
let seatId = '';
let token = '';

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T471RS');
  await register('passenger', MADINA, 'female');
  await register('passenger', SHAHLO, 'female');
  const { trip, seat } = await confirmedSeat(DRIVER, MADINA);
  const second = await book(SHAHLO, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  await answer(DRIVER, second.id, 'confirm');
  tripId = trip.id;
  seatId = seat.id;
  token = (await createChatClient(await signedAs('passenger', MADINA)).share(seat.id)).link.slice(-43);
  // Older reviews of the driver, published long ago (docs/24): the stars and «Yana koʻrsatish».
  const at = Date.now() - 10 * DAY;
  const rows = Array.from({ length: REVIEWS }, (_, n) => {
    const rater = n % 2 === 0 ? MADINA.id : SHAHLO.id;
    const words = n === 0 ? 'Yoʻlda ehtiyotkor, vaqtida keldi' : '';
    return `('g46-r${String(n)}', 'g46-b${String(n)}', ${rater}, ${DRIVER.id}, 5, '[]', '${words}', ${at - n * DAY}, ${at})`;
  });
  standSql(
    `INSERT OR IGNORE INTO reviews (id, booking_id, rater_id, ratee_id, stars, tags, text, created_at, updated_at) VALUES ${rows.join(', ')}`,
  );
});

test('S76. close people see the face and the stars of the driver', async ({ page }) => {
  await register('passenger', MOTHER, 'female');
  await openAs(page, 'passenger', MOTHER, { search: `?follow=${token}` });
  await expect(page.getByText(/★ 5/u)).toBeVisible();
  await expect(page.getByRole('img', { name: DRIVER.name })).toBeVisible();
  await shot(page, '1-follow');
});

test('P78, P79. «Hamrohlaringiz» on the seat; the complaint names the driver or a companion', async ({
  page,
}) => {
  await openAs(page, 'passenger', MADINA, { search: `?booking=${seatId}` });
  await expect(page.getByText(t('bookings.coRiders'))).toBeVisible();
  await shot(page, '2-co-riders');
  await page.getByText(t('complaints.title'), { exact: true }).click();
  await expect(page.getByText(t('complaints.aboutTitle'))).toBeVisible();
  await page.getByText(SHAHLO.name, { exact: true }).click();
  await shot(page, '3-complaint-about');
});

test('P80. every review of the driver with its day, the older ones on demand', async ({ page }) => {
  // One who has no seat on the trip opens it: a seat holder lands on the seat (docs/172).
  await openAs(page, 'passenger', MOTHER, { start: `trip_${tripId}` });
  await page.getByText(t('find.allReviews', { count: String(REVIEWS) })).click();
  await expect(page.getByText(/ · Yoʻlda ehtiyotkor, vaqtida keldi$/u)).toBeVisible();
  await shot(page, '4-reviews');
  await page.getByText(t('market.mine.more')).click();
  await expect(page.locator('.row-card')).toHaveCount(REVIEWS);
  await shot(page, '5-reviews-more');
});
