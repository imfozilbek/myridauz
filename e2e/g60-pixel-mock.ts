import type { Page } from '@playwright/test';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { playCall } from './call-mock';
import { chatSocket } from './chat-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

// The data of the mockups of G60 (docs/goals/g60/*.png), one to one: the same day, time, names
// and messages, so that the pixel diff shows only what the code does differently (lesson 151).
export const tashkent = (time: string) => Date.parse(`${time}+05:00`);
const CHILONZOR = '1726294';
const SAMARQAND = '1718401';
const KM = 300;
const [PASSENGER] = MINI_APPS;

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/pixel-g60/${name}-code.png`, animations: 'disabled' });

// The app at the moment of the mockup, with these seats of the passenger.
export async function openAt(page: Page, now: string, bookings: readonly object[], query = '') {
  await page.clock.setFixedTime(tashkent(now));
  await page.route('**/api/passenger/bookings', (route) => route.fulfill({ json: { bookings } }));
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}${query}`));
}

export function mockupBooking(departAt: number, extra: object = {}) {
  const trip = {
    ...confirmed.trip,
    from: CHILONZOR,
    to: SAMARQAND,
    departAt,
    firstDepartAt: departAt,
    km: KM,
    price: 90000,
    driver: {
      ...confirmed.trip.driver,
      firstName: 'Jasur',
      hasAvatar: false,
      rating: { average: 4.9, count: 23 },
      car: { ...confirmed.trip.driver.car, make: 'Chevrolet', model: 'Cobalt', color: 'white' },
    },
  };
  return { ...confirmed, trip, seats: 2, price: 90000, plate: '01A123BC', ...extra };
}

type Message = { readonly author: 'me' | 'other' | 'system'; readonly text: string; readonly at: number };

// The chat of the mockup: its messages, as the chat socket sends them.
export async function mockupChat(page: Page, messages: readonly Message[], canWrite = true) {
  const history = messages.map((message, index) => ({
    id: index + 1,
    author: message.author,
    text: message.author === 'system' ? '' : message.text,
    event: message.author === 'system' ? message.text : null,
    at: message.at,
  }));
  await page.routeWebSocket(/\/chats\/.+\/socket/u, (ws) => {
    chatSocket.current = ws;
    ws.send(JSON.stringify({ type: 'history', messages: history, canCall: canWrite, canWrite }));
    ws.onMessage((raw) => playCall(ws, (JSON.parse(String(raw)) as { action?: string }).action ?? ''));
  });
}

// The shared trip of the close people (mockup g60/3): Madina on the way to Samarqand.
export const mockupShared = (departAt: number, status: string) => ({
  passengerName: 'Madina',
  from: CHILONZOR,
  to: SAMARQAND,
  departAt,
  firstDepartAt: departAt,
  km: KM,
  driver: { firstName: 'Jasur', car: { make: 'Chevrolet', model: 'Cobalt', color: 'white' } },
  plate: '01A123BC',
  meetingPoint: { lat: 41.2856, lng: 69.2034 },
  dropoffPoint: { lat: 39.6547, lng: 66.9758 },
  status,
  followers: 1,
});
