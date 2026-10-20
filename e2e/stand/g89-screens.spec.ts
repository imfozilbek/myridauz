import { createChatClient, createFeedbackClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { afterSplash, expect, test } from '../crash-guard';
import { confirmedSeat } from './g27-kit';
import { OWNER } from './people';
import { NARROW, t } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { standRows } from './stand-tools';

// G89 (docs/213, docs/214) on the whole local Rida: changed states of screens, each shot for the
// owner (docs/33) into screenshots/stand/g89/.
test.describe.configure({ mode: 'serial' });
test.use({ viewport: NARROW });
test.afterEach(() => expect(outsideCalls()).toEqual([]));
const OUT = 'screenshots/stand/g89';
const DRIVER: Person = { id: 900891, name: 'Sardor', phone: '998901110891' };
const LOLA: Person = { id: 900892, name: 'Lola', phone: '998901110892' };
const MOTHER: Person = { id: 900893, name: 'Ona', phone: '998901110893' };
const shot = async (page: Page, name: string) => {
  await afterSplash(page);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
};
let seatId = '';
let token = '';

test.beforeAll(async () => {
  await approvedDriver(DRIVER, '01T891SR');
  await register('passenger', LOLA, 'female');
  const { seat } = await confirmedSeat(DRIVER, LOLA);
  seatId = seat.id;
  token = (await createChatClient(await signedAs('passenger', LOLA)).share(seat.id)).link.slice(-43);
});

test('U6. close people without the network see «Qayta urinish», not «the trip is gone»', async ({ page }) => {
  await register('passenger', MOTHER, 'female');
  await page.route('**/shared/**', (route) => route.abort());
  await openAs(page, 'passenger', MOTHER, { search: `?follow=${token}` });
  await expect(page.getByText(t('common.retry'))).toBeVisible();
  await shot(page, '1-follow-no-network');
});

test('A11. a «Kelmadi» of a passenger about the driver has no refund switch', async ({ page }) => {
  await createFeedbackClient(await signedAs('passenger', LOLA)).complain({
    bookingId: seatId,
    reasons: ['no_show'],
    comment: 'Haydovchi kelmadi',
  });
  const [complaint] = standRows(`SELECT id FROM complaints WHERE booking_id = '${seatId}'`);
  await openAs(page, 'admin', OWNER, { search: `?complaint=${String(complaint?.['id'])}` });
  await expect(page.getByText(t('navbat.complaint.who'))).toBeVisible();
  await expect(page.getByText(t('complaints.refund'))).toHaveCount(0);
  await shot(page, '2-complaint-no-refund');
});
