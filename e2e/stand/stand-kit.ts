import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { MiniApp } from '@platform/contracts';
import { signTelegramData } from '../../apps/backend/src/shared/auth/test-signing';
import { STAND_API_PORT, STAND_APPS, STAND_VARS } from '../../scripts/stand/paths.ts';
import { mockTelegram, telegramUrl } from '../telegram-mock';

// The people of the stand (docs/75): Telegram launch data and phones signed with the test tokens
// of its bots, as Telegram signs them on a phone. Nothing here works with real tokens.
const API = `http://localhost:${STAND_API_PORT}`;
const SECOND = 1000;

export type Person = { readonly id: number; readonly name: string; readonly phone: string };

const tokens = (): Record<string, string> =>
  Object.fromEntries(
    readFileSync(STAND_VARS, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('=', 2) as [string, string]),
  );
const tokenOf = (app: MiniApp): string => {
  const token = tokens()[`${app.toUpperCase()}_BOT_TOKEN`];
  if (!token) throw new Error(`stand: no token of ${app}, run pnpm stand`);
  return token;
};
const now = () => Math.floor(Date.now() / SECOND);

// Which bot used this token: passenger, driver or admin (the stub of Telegram keeps the token).
export const botOfToken = (token: string): string => {
  const key = Object.entries(tokens()).find(([, value]) => value === token)?.[0] ?? '';
  return key.replace('_BOT_TOKEN', '').toLowerCase();
};

// The Telegram SDK reads launch data only with a signature field; it is signed like the rest.
const SIGNATURE = 'stand';

const initDataOf = (app: MiniApp, person: Person, signedAt = now()) =>
  signTelegramData(
    tokenOf(app),
    { user: { id: person.id, first_name: person.name, allows_write_to_pm: true }, signature: SIGNATURE },
    signedAt,
  );

export const contactOf = (app: MiniApp, person: Person) =>
  signTelegramData(
    tokenOf(app),
    { contact: { user_id: person.id, phone_number: person.phone, first_name: person.name } },
    now(),
  );

// The options of the API clients for one person in one Mini App.
export const signedAs = async (app: MiniApp, person: Person) => ({
  baseUrl: API,
  fetch: (input: string, init?: RequestInit) => fetch(input, init),
  app,
  initData: await initDataOf(app, person),
});

// A launch older than a day, as a Mini App left open since yesterday (docs/81 A11).
const DAY_SECONDS = 24 * 60 * 60;
export const staleSignedAs = async (app: MiniApp, person: Person) => ({
  ...(await signedAs(app, person)),
  initData: await initDataOf(app, person, now() - DAY_SECONDS - 60),
});

// The stand never reaches the outside (docs/75): a request or a socket to another host is stopped
// and named, and the scenario fails on it (lesson 56).
const outside = (url: URL) => url.hostname !== 'localhost';
const leaks: string[] = [];
async function guardOutside(page: Page) {
  await page.route(outside, (route) => {
    leaks.push(route.request().url());
    return route.abort();
  });
  await page.routeWebSocket(outside, (socket) => {
    leaks.push(socket.url());
    return socket.close();
  });
}
export const outsideCalls = (): readonly string[] => leaks.map((url) => new URL(url).host);

// Opens a Mini App of the stand as this person, as Telegram opens it on a phone. search: what a bot
// button adds to the address, such as ?booking=<id> (docs/65 B5). stale: a launch older than a day.
type OpenOptions = { platform?: 'android' | 'ios'; search?: string; stale?: boolean };
export async function openAs(
  page: Page,
  app: MiniApp,
  person: Person,
  { platform = 'android', search = '', stale = false }: OpenOptions = {},
) {
  await guardOutside(page);
  await mockTelegram(page, await contactOf(app, person));
  const url = `http://localhost:${STAND_APPS[app]}/${search}`;
  const signedAt = stale ? now() - DAY_SECONDS - 60 : now();
  await page.goto(telegramUrl(url, platform, await initDataOf(app, person, signedAt)));
}
