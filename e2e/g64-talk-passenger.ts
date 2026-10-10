import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { chatSocket } from './chat-mock';
import { sardor, tashkent, TOMORROW } from './g64-requests-mock';
import { JASUR, KEY, offerOf, TODAY } from './g64-talk-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The talk on the side of the passenger (mockup g64/4): Sardor asked the whole car, Jasur offered
// tomorrow 08:00 from the pitak, 4 seats × 90 000.
const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER] = MINI_APPS;
const HISTORY = [
  {
    id: 1,
    author: 'other',
    text: 'Assalomu alaykum! Ertaga 8 da Samarqandga ketaman, salon boʻsh.',
    at: '19:02',
  },
  { id: 2, author: 'me', text: 'Yaxshi, taklif yuboring.', at: '19:03' },
].map((line) => ({ ...line, event: null, at: tashkent(`${TODAY}T${line.at}`) }));

// fresh: the offer came during the call, «hozir keldi» (g64/4 phone 2); else it came before.
export async function openPassengerTalk(page: Page, fresh = false) {
  const request = sardor(TOMORROW);
  const offer = {
    ...offerOf(request),
    seats: 4,
    wholeCar: true,
    createdAt: tashkent(`${TODAY}T${fresh ? '19:04' : '11:00'}`),
  };
  await mockApi(page, 'active');
  await page.route('**/api/passenger/requests', (route) => route.fulfill({ json: { requests: [request] } }));
  await page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings: [] } }));
  await page.route('**/api/passenger/offers', (route) => route.fulfill({ json: { offers: [offer] } }));
  await page.route('**/api/chats/*/ticket', (route) =>
    route.fulfill({ json: { url: `ws://localhost:4199/chats/${KEY}/socket?ticket=e2e` } }),
  );
  const about = { booking: null, role: 'passenger', request, offer, driver: JASUR };
  await page.route('**/api/chats/*/about', (route) => route.fulfill({ json: about }));
  await page.routeWebSocket(/\/chats\/.+\/socket/u, (ws) => {
    chatSocket.current = ws;
    ws.send(JSON.stringify({ type: 'history', messages: HISTORY, canCall: true }));
  });
  await page.clock.setFixedTime(tashkent(`${TODAY}T12:20`));
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(PASSENGER.port), 'android'));
  await page.getByText(t('common.myTrips')).click();
  await page.locator('.mine-card').first().click();
  await page.locator('.offer-card').first().click();
  await page.getByText(t('chat.open')).click();
  await page.getByText(HISTORY[1]?.text ?? '').waitFor();
}
