import { AUTH_HEADER, AUTH_SCHEME, MINI_APP_HEADER, MINI_APPS, type MiniApp } from '@platform/contracts';
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../../env';
import { adminIds, botToken } from '../telegram/bot-config';
import { readTelegramUser } from './telegram-fields';
import { verifySignedParams } from './verify-signed-params';

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
// Telegram signs initData when the Mini App opens. A day is enough for one session in the app.
const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

const isMiniApp = (value: string | undefined): value is MiniApp =>
  (MINI_APPS as readonly string[]).includes(value ?? '');

// Every API route behind it knows who calls: the signature of the bot of that Mini App is checked
// on each request (docs/32). initData of another bot, an old one or a forged one is rejected.
export function telegramAuth(now: () => number): MiddlewareHandler<AppEnv> {
  return async (context, next) => {
    const app = context.req.header(MINI_APP_HEADER);
    const [scheme, raw] = (context.req.header(AUTH_HEADER) ?? '').split(' ', 2);
    const token = isMiniApp(app) ? botToken(context.env, app) : undefined;
    if (!isMiniApp(app) || !token || scheme !== AUTH_SCHEME || !raw) {
      return context.json({ error: 'auth.missing' }, UNAUTHORIZED);
    }
    const signed = await verifySignedParams(raw, {
      botToken: token,
      now: now(),
      maxAgeSeconds: INIT_DATA_MAX_AGE_SECONDS,
    });
    if (!signed.ok) return context.json({ error: signed.error }, UNAUTHORIZED);
    const user = readTelegramUser(signed.fields);
    if (!user) return context.json({ error: 'auth.invalid' }, UNAUTHORIZED);
    const isAdmin = adminIds(context.env).has(user.id);
    // The admin Mini App is only for the team (docs/02).
    if (app === 'admin' && !isAdmin) return context.json({ error: 'auth.not_admin' }, FORBIDDEN);
    context.set('session', { app, user, botToken: token, isAdmin });
    await next();
  };
}
