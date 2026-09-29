import type { Page, Route, WebSocketRoute } from '@playwright/test';
import { playCall } from './call-mock';
import { confirmed } from './bookings-mock';

// The chat and the shared trip as the Mini Apps see them (G09). The chat socket is played by the test.
const KEY = 'b00000000-0000-4000-8000-0000000000b2';
const at = (minutesAgo: number) => Date.now() - minutesAgo * 60_000;
const HISTORY = [
  { id: 1, author: 'system', text: '', event: 'requested', at: at(50) },
  {
    id: 2,
    author: 'other',
    text: 'Assalomu alaykum! Chilonzor metrosi yonida kutaman.',
    event: null,
    at: at(45),
  },
  { id: 3, author: 'me', text: 'Vaalaykum assalom! Soat 08:30 da boraman.', event: null, at: at(40) },
  { id: 4, author: 'system', text: '', event: 'confirmed', at: at(30) },
];
export const SHARE_TOKEN = 'e2eE2eE2eE2eE2eE2eE2eE2eE2eE2eE2eE2eE2eE2e1';

// The open chat socket: a test plays the other side of a call on it (G13).
export const chatSocket: { current: WebSocketRoute | null } = { current: null };

export async function mockChat(page: Page) {
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });
  await page.route('**/api/chats/*/ticket', (route) =>
    json(route, { url: `ws://localhost:4199/chats/${KEY}/socket?ticket=e2e` }),
  );
  await page.routeWebSocket(/\/chats\/.+\/socket/u, (ws) => {
    chatSocket.current = ws;
    ws.send(JSON.stringify({ type: 'history', messages: HISTORY, canCall: true }));
    let id = HISTORY.length;
    ws.onMessage((raw) => {
      const event = JSON.parse(String(raw)) as { type: string; text: string; action?: string };
      if (event.type !== 'send') return playCall(ws, event.action ?? '');
      const { text } = event;
      // Like the real room (docs/07): phones and @usernames become "***".
      const shown = text.replace(/\+?\d[\d\s-]{7,}\d/gu, '***').replace(/@\w{3,}/gu, '***');
      const masked = shown !== text;
      id += 1;
      ws.send(
        JSON.stringify({
          type: 'message',
          message: { id, author: 'me', text: shown, event: null, at: Date.now() },
        }),
      );
      if (masked) ws.send(JSON.stringify({ type: 'warning' }));
    });
  });
  await page.route('**/api/passenger/bookings/*/share', (route) =>
    json(route, { preparedMessageId: null, link: `https://t.me/test_bot?start=follow_${SHARE_TOKEN}` }, 201),
  );
  await page.route('**/api/passenger/bookings/*/share/stop', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/passenger/bookings/*/boarded', (route) =>
    json(route, { ...confirmed, boardedAt: Date.now() }),
  );
  await page.route('**/api/shared/*/follow', (route) => route.fulfill({ status: 204 }));
  await page.route(`**/api/shared/${SHARE_TOKEN}`, (route) =>
    json(route, {
      passengerName: 'Madina',
      from: '1726294',
      to: '1718401',
      departAt: at(-90),
      km: 300,
      driver: { firstName: 'Jasur', car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' } },
      plate: '01A123BC',
      meetingPoint: { lat: 41.2856, lng: 69.2034 },
      status: 'boarded',
      followers: 1,
    }),
  );
}
