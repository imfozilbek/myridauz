import { MINI_APPS, type MiniApp } from '@platform/contracts';

// One bot per role, each opens its own Mini App (docs/02).
export const BOT_ROLES = MINI_APPS;
export type BotRole = MiniApp;

export const isBotRole = (value: string): value is BotRole =>
  (BOT_ROLES as readonly string[]).includes(value);
