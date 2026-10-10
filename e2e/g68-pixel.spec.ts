import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { WebSocketRoute } from '@playwright/test';
import { expect, test, type Page } from './crash-guard';
import { openDriverHome } from './g66-driver-mock';
import { openPassengerHome } from './g66-home-mock';
import { ask, asked, DEPART, NOW, offers, seat, taken, trip, withLists } from './g68-sheet-mock';

// Pixel Perfect of the sheet of the open Mini App (G68, lessons 141, 147, 151): the phones of the
// mockups g68/7 and g68/8 at 360 × 808 and their scale 1.375 (495 px wide), with their data; the diff
// is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g68';
const WORDS = 'Uydan olib ketaman, 07:50 da Grand oldida boʻlaman.';
test.use({ viewport: { width: 360, height: 808 }, deviceScaleFactor: 1.375, actionSheets: 'keep' });

// Nothing is cut (docs/121): every word of a button fits its button.
async function wholeWords(page: Page) {
  const cut = await page
    .locator('.action-buttons button span')
    .evaluateAll((spans) =>
      spans.filter((span) => span.scrollWidth > span.clientWidth + 1).map((span) => span.textContent),
    );
  expect(cut).toEqual([]);
}

async function shot(page: Page, name: string) {
  // The sheet rises in 0.3 s: the picture waits until it stands.
  await page.waitForTimeout(600);
  await wholeWords(page);
  // The letters of the mockup have coloured edges: Chromium draws them so only on an opaque layer. The
  // sheet gets the white it already stands on, with the corners of the drawer (docs/156).
  await page.addStyleTag({
    content: '.action-sheet{background:var(--reg-card);border-radius:16px 16px 0 0}',
  });
  await page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
}

const about = { booking: seat, role: 'passenger', request: null, offer: null, driver: null };
// The wallet holds the commission: the sheet offers «Tasdiqlash» as on the mockup (G75 checks it).
const WALLET = { bonus: 482000, main: 0, bonusExpiresAt: null, seatsLeft: 24, operations: [] };

test('7-3: a new request to the driver', async ({ page }) => {
  await openDriverHome(page, 'free');
  await withLists(page, {
    'driver/trips': { trips: [trip] },
    'driver/bookings': { bookings: [ask('d1', 'Madina')] },
    'driver/wallet': WALLET,
  });
  await expect(page.locator('.action-kicker', { hasText: t('sheet.request.kicker') })).toBeVisible();
  await shot(page, '7-3');
});

test('7-5: three requests wait: «1 / 3»', async ({ page }) => {
  await openDriverHome(page, 'free');
  const three = [ask('d1', 'Madina'), ask('d2', 'Olim'), ask('d3', 'Sardor')];
  await withLists(page, {
    'driver/trips': { trips: [trip] },
    'driver/bookings': { bookings: three },
    'driver/wallet': WALLET,
  });
  await expect(page.getByText('1 / 3')).toBeVisible();
  await shot(page, '7-5');
});

test('7-6: the passenger took the offer: «Taklif qabul qilindi»', async ({ page }) => {
  await openDriverHome(page, 'free');
  await withLists(page, {
    'driver/trips': { trips: [taken.trip] },
    'driver/bookings': { bookings: [taken] },
  });
  await expect(page.getByText(t('sheet.answer.offer'))).toBeVisible();
  await shot(page, '7-6');
});

test('8-1: a new offer to the passenger', async ({ page }) => {
  await openPassengerHome(page);
  await withLists(page, { 'passenger/requests': { requests: [asked] }, 'passenger/offers': { offers } });
  await expect(page.getByText(t('sheet.offer.kicker'))).toBeVisible();
  await shot(page, '8-1');
});

test('8-2: a new message with ready answers', async ({ page }) => {
  await openPassengerHome(page);
  await withLists(page, {
    'passenger/bookings': { bookings: [seat] },
    'chats/unread': { chats: [{ key: seat.chatKey, count: 1, text: WORDS, at: NOW }] },
    'chats/*/about': about,
  });
  await expect(page.getByText(t('sheet.message.kicker'))).toBeVisible();
  await shot(page, '8-2');
});

async function ringing(page: Page) {
  await openPassengerHome(page);
  const feeds: WebSocketRoute[] = [];
  await page.routeWebSocket('**/feed/socket**', (socket) => void feeds.push(socket));
  await page.routeWebSocket(/\/chats\/.+\/socket/u, (ws) => {
    ws.send(JSON.stringify({ type: 'history', messages: [], canCall: true }));
    ws.send(JSON.stringify({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
  });
  await withLists(page, { 'passenger/bookings': { bookings: [seat] }, 'chats/*/about': about });
  await expect.poll(() => feeds.length).toBeGreaterThan(0);
  feeds.forEach((feed) => feed.send(JSON.stringify({ type: 'call', chat: seat.chatKey })));
  await expect(page.getByText(t('sheet.call.hidden'))).toBeVisible();
}

test('8-3: a call while the app is open', async ({ page }) => {
  await ringing(page);
  await shot(page, '8-3');
});

test('a call on a 320 px phone: «Rad etish» and «Javob berish» stay whole', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await ringing(page);
  await page.waitForTimeout(600);
  await wholeWords(page);
});

test('8-4: the driver came to the meeting', async ({ page }) => {
  await openPassengerHome(page);
  await page.clock.setFixedTime(DEPART - 10 * 60_000);
  const came = { ...seat, driverCameAt: DEPART - 11 * 60_000 };
  await withLists(page, { 'passenger/bookings': { bookings: [came] } });
  await expect(page.locator('.action-kicker', { hasText: t('sheet.meet.kicker') })).toBeVisible();
  await shot(page, '8-4');
});
