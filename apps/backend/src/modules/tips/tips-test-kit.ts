import { DAY_MS, HOUR_MS } from '@platform/contracts';
import { vi } from 'vitest';
import { fakeTelegram } from '../../bots/test-bot';
import type { Bindings } from '../../env';
import { testEnv } from '../../test-api';
import { testD1 } from '../../test-d1';
import { sendTips } from './index';

// Test helper of the tips of a step (G70a, docs/232): 12:05 in Tashkent, a seeded D1, a fake Telegram.
export const NOON = Date.UTC(2026, 9, 5, 7, 5);
export const ago = (ms: number) => NOON - ms;
export const iso = (ms: number) => new Date(ms).toISOString();
export { DAY_MS as DAY, HOUR_MS as HOUR };

export const people = (...ids: number[]) =>
  `INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at, public_id) VALUES ${ids
    .map((id) => `(${id}, 'P${id}', 'male', '99890${id}', 0, 0, 0, 'pub${id}')`)
    .join(', ')};`;
export const trip = (id: string, driver: number, departAt: number, endsAt: number, more = '') =>
  `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ('${id}', ${driver}, '1726', '1718', ${departAt}, ${endsAt}, 300, 4, 100000, 'active', 0); ${more}`;
export const booking = (id: string, tripId: string, passenger: number, status: string, createdAt = 0) =>
  `INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
    VALUES ('${id}', '${tripId}', ${passenger}, 1, 100000, 10000, '${status}', 0, ${createdAt}, 0);`;
export const approved = (driver: number, decidedAt = 0) =>
  `INSERT INTO driver_applications (user_id, status, updated_at) VALUES (${driver}, 'approved', 0);
  INSERT INTO application_log (user_id, status, reasons, decided_by, decided_at)
    VALUES (${driver}, 'approved', '[]', 900, ${decidedAt});`;

export async function tipsDb(seed: string): Promise<D1Database> {
  const db = testD1();
  await db.exec(`PRAGMA foreign_keys = OFF; ${seed}`);
  return db;
}

type Sent = { readonly bot: string; readonly chat: number; readonly body: Record<string, unknown> };

// One run of the job at `at`: the messages it sent, by bot.
export async function runTips(db: D1Database, at = NOON): Promise<Sent[]> {
  const telegram = fakeTelegram();
  vi.stubGlobal('fetch', telegram.fetch);
  vi.setSystemTime(at);
  await sendTips({ ...testEnv, DB: db } as unknown as Bindings, at);
  const bots: Readonly<Record<string, string>> = {
    [testEnv.PASSENGER_BOT_TOKEN]: 'passenger',
    [testEnv.DRIVER_BOT_TOKEN]: 'driver',
  };
  return telegram.calls
    .filter((call) => call.method === 'sendMessage')
    .map((call) => ({
      bot: bots[call.token] ?? call.token,
      chat: Number(call.body.chat_id),
      body: call.body,
    }));
}

// The button of a tip that opens the Mini App.
export const openUrl = (sent: Sent | undefined) => {
  const markup = sent?.body.reply_markup as
    { inline_keyboard: { web_app?: { url: string } }[][] } | undefined;
  return new URL(markup?.inline_keyboard[0]?.[0]?.web_app?.url ?? 'https://none/');
};
