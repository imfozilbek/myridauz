import { MINI_APPS, type MiniApp } from '@platform/contracts';
import type { Bindings } from '../env';

// One bot per role, each opens its own Mini App (docs/02).
export const BOT_ROLES = MINI_APPS;
export type BotRole = MiniApp;

export const isBotRole = (value: string): value is BotRole =>
  (BOT_ROLES as readonly string[]).includes(value);

export function botToken(env: Bindings, role: BotRole): string | undefined {
  return { passenger: env.PASSENGER_BOT_TOKEN, driver: env.DRIVER_BOT_TOKEN, admin: env.ADMIN_BOT_TOKEN }[
    role
  ];
}

export function adminIds(env: Bindings): ReadonlySet<number> {
  return new Set((env.ADMIN_TELEGRAM_IDS ?? '').split(',').filter(Boolean).map(Number));
}
