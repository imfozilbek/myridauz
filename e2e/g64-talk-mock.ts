import type { Page } from '@playwright/test';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { openBoard, sardor, tashkent, TOMORROW, type Board } from './g64-requests-mock';

// The talk of the driver Jasur and the passenger Sardor before a booking, as on the mockups g64/2,
// g64/4 and g64/5: two messages, the request on top, the offer of tomorrow 08:00 from the pitak.
const { t } = createI18n(DEFAULT_LOCALE);
const KEY = 't00000000-0000-4000-8000-0000000000a1';
const TODAY = '2026-10-06';
const HISTORY = [
  { id: 1, author: 'me', text: 'Assalomu alaykum! Ertaga 8 da Samarqandga ketaman.', at: '19:02' },
  { id: 2, author: 'other', text: 'Yaxshi, taklif yuboring.', at: '19:03' },
].map((line) => ({ ...line, event: null, at: tashkent(`${TODAY}T${line.at}`) }));
const JASUR = {
  id: '00000000000000000000000000000007',
  firstName: 'Jasur',
  hasAvatar: false,
  car: { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC' },
  rating: { average: 4.8, count: 37 },
};

export type Talk = 'trip' | 'salon' | 'sent';
const REQUESTS = {
  trip: { ...sardor(TOMORROW), wholeCar: false },
  salon: sardor(TOMORROW),
  sent: { ...sardor(TOMORROW), wholeCar: false },
};
const offerOf = (request: (typeof REQUESTS)[Talk]) => ({
  id: '00000000-0000-4000-8000-0000000000c1',
  requestId: request.id,
  driver: JASUR,
  from: request.from,
  to: request.to,
  departAt: tashkent(`${TOMORROW}T08:00`),
  km: request.km,
  seats: request.seats,
  wholeCar: false,
  price: request.price,
  commission: 0,
  status: 'sent',
  bookingId: null,
  chatKey: KEY,
  tripId: null,
  pitak: 'Qoʻyliq pitagi',
  createdAt: tashkent(`${TODAY}T19:04`),
});

// The chat of a talk on the side of the driver, opened from the card of the board.
export async function openDriverTalk(page: Page, talk: Talk) {
  const board: Board = talk === 'salon' ? 'salon' : 'trip';
  const request = REQUESTS[talk];
  await page.route('**/api/driver/requests/*/talk', (route) => route.fulfill({ json: { chatKey: KEY } }));
  await page.route('**/api/chats/*/ticket', (route) =>
    route.fulfill({ json: { url: `ws://localhost:4199/chats/${KEY}/socket?ticket=e2e` } }),
  );
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({
      json: {
        booking: null,
        role: 'driver',
        request,
        offer: talk === 'sent' ? offerOf(request) : null,
        driver: null,
      },
    }),
  );
  await page.routeWebSocket(/\/chats\/.+\/socket/u, (ws) => {
    ws.send(JSON.stringify({ type: 'history', messages: HISTORY, canCall: true }));
  });
  await openBoard(page, board);
  await page.locator('.request-row', { hasText: 'Sardor' }).getByLabel(t('chat.open')).click();
  await page.getByText(HISTORY[1]?.text ?? '').waitFor();
}
