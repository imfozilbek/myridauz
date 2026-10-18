import { createFeedbackClient, createUsersClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { say } from './bot-kit';
import { confirmedSeat } from './g27-kit';
import { OWNER } from './people';
import { NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { botMessages, standRows, standSql } from './stand-tools';

// G45 (docs/111, docs/79 T29) on the whole local Rida: the new screens of the team, each shot for the
// owner (docs/33) into screenshots/stand/g45/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g45';
const DRIVER: Person = { id: 900453, name: 'Javlon', phone: '998901110453' };
const PASSENGER: Person = { id: 900454, name: 'Mohira', phone: '998901110454' };
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
const main = (page: Page, text: string) => page.locator('#tg-main-button', { hasText: text });
// The same address with a new signature is only a new hash: the page is left first, so it loads again.
const management = async (page: Page, row: string) => {
  await page.goto('about:blank');
  await openAs(page, 'admin', OWNER);
  await page.getByText(t('common.admin.management')).click();
  await page.getByText(row, { exact: true }).click();
};
let tripId = '';
let seatId = '';
let passengerId = '';

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T453UV');
  await register('passenger', PASSENGER, 'female');
  const { trip, seat } = await confirmedSeat(DRIVER, PASSENGER);
  tripId = trip.id;
  seatId = seat.id;
  const me = await createUsersClient(await signedAs('passenger', PASSENGER)).getMe();
  passengerId = me.state === 'active' ? me.profile.id : '';
  const at = Date.now();
  await standSql(
    `INSERT OR IGNORE INTO reviews (id, booking_id, rater_id, ratee_id, stars, tags, text, created_at, updated_at) ` +
      `VALUES ('g45-review', '${seat.id}', ${PASSENGER.id}, ${DRIVER.id}, 1, '[]', 'Telefonda gaplashib haydadi', ${at}, ${at})`,
  );
  await createFeedbackClient(await signedAs('passenger', PASSENGER)).complain({
    bookingId: seat.id,
    reasons: ['unsafe_driving'],
    comment: 'Juda tez haydadi',
  });
});

test('T29. «Sharhlar»: the team hides a review with one tap', async ({ page }) => {
  await management(page, t('manage.reviews'));
  const title = t('manage.review.title', { stars: '1', author: PASSENGER.name, about: DRIVER.name });
  await expect(page.getByText(title)).toBeVisible();
  await shot(page, '1-reviews');
  await page.getByText(title).click();
  await shot(page, '2-review-sheet');
  await main(page, t('manage.review.hide')).dispatchEvent('click');
  await expect
    .poll(() => standRows(`SELECT hidden FROM reviews WHERE id = 'g45-review'`)[0]?.['hidden'])
    .toBe(1);
});

test('Q8. the support copy has the public id and «Profilni ochish»; the link opens the person', async ({
  page,
}) => {
  await say('support', PASSENGER, 'Haydovchi javob bermayapti');
  // The copy goes to the one member support is assigned to (docs/92): «Profilni ochish» only when it
  // is an owner, as «Odamlar» is the owner's.
  const copy = (await botMessages()).findLast((message) =>
    message.text.includes('Haydovchi javob bermayapti'),
  );
  expect(copy?.text).toContain(passengerId);
  const profile = copy?.buttons.some((button) => button.text === t('bot.supportCard.openProfile'));
  expect(profile).toBe(copy?.chatId === OWNER.id);
  await openAs(page, 'admin', OWNER, { search: `?open=people&person=${passengerId}` });
  await expect(page.getByText(t('manage.person.asPassenger'))).toBeVisible();
  await expect(page.getByText(t('manage.person.lastRides'))).toBeVisible();
  await shot(page, '3-person');
});

test('G45. a complaint carries the history of both sides', async ({ page }) => {
  const [complaint] = standRows(`SELECT id FROM complaints WHERE booking_id = '${seatId}'`);
  await openAs(page, 'admin', OWNER, { search: `?complaint=${String(complaint?.['id'])}` });
  await expect(page.getByText(/^\d+ safar · 1 shikoyat$/u)).toBeVisible();
  await shot(page, '4-complaint');
});

test('Q5. the team cancels the trip with a reason; both sides hear it', async ({ page }) => {
  await openAs(page, 'admin', OWNER, { search: `?open=trips&trip=${tripId}` });
  await page.getByText(t('market.teamCancel.title')).click();
  await page.getByLabel(t('market.teamCancel.reason')).fill('Haydovchi hujjatlari tekshirilmoqda');
  await shot(page, '5-cancel-sheet');
  await main(page, t('market.teamCancel.confirm')).dispatchEvent('click');
  await expect
    .poll(() => standRows(`SELECT status FROM trips WHERE id = '${tripId}'`)[0]?.['status'])
    .toBe('cancelled');
  // The bots tell both sides through the queue: a moment later.
  const heard = (chat: number, words: string) =>
    expect
      .poll(async () => (await botMessages()).some((m) => m.chatId === chat && m.text.includes(words)))
      .toBe(true);
  await heard(DRIVER.id, 'Haydovchi hujjatlari tekshirilmoqda');
  await heard(PASSENGER.id, 'jamoa bekor qildi');
});

test('G45. the distance, a limit and the period before, as the owner sees them', async ({ page }) => {
  await management(page, t('pricing.title'));
  await page
    .getByText(/^Formula: /u)
    .first()
    .click();
  await expect(page.getByText(t('pricing.distance'), { exact: true })).toBeVisible();
  await shot(page, '6-direction-distance');
  await page
    .getByText(/^\d+\skm$/u)
    .first()
    .click();
  await shot(page, '7-distance-sheet');
  await management(page, t('manage.limits'));
  await page.getByText(t('manage.limit.bookings.answerHours'), { exact: true }).first().click();
  await expect(page.getByText(t('manage.limitWhy.bookings.answerHours'))).toBeVisible();
  await shot(page, '8-limit-sheet');
  await management(page, t('common.admin.statistics'));
  await expect(page.getByText(t('stats.compare.day'))).toBeVisible();
  await shot(page, '9-stats');
});
