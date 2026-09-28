import type { MiniApp } from '@platform/contracts';
import type { Bindings } from '../../env';

// One bot per Mini App (docs/02). Tokens are Worker secrets, never in the repository (docs/32).
export function botToken(env: Bindings, app: MiniApp): string | undefined {
  return { passenger: env.PASSENGER_BOT_TOKEN, driver: env.DRIVER_BOT_TOKEN, admin: env.ADMIN_BOT_TOKEN }[
    app
  ];
}

// The team list by Telegram id (docs/02): a Worker secret of the brand.
export function adminIds(env: Bindings): ReadonlySet<number> {
  return new Set((env.ADMIN_TELEGRAM_IDS ?? '').split(',').filter(Boolean).map(Number));
}
