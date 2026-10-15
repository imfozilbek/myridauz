import { safeEqual } from '../http/safe-equal';

// Telegram puts the secret_token of the webhook into this header of every update.
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

// Whether an update came from Telegram: it carries the secret_token of our webhook (docs/32).
export const fromTelegram = (request: { header(name: string): string | undefined }, secret: string) =>
  safeEqual(request.header(SECRET_HEADER) ?? '', secret);

// setup-bots sends the same secret in its own header: only it points the bots and sets their looks
// (docs/45, docs/180). No secret in the Worker: nobody may.
const SETUP_HEADER = 'x-setup-secret';
export const fromSetup = (
  request: { header(name: string): string | undefined },
  secret: string | undefined,
) => (secret ? safeEqual(request.header(SETUP_HEADER) ?? '', secret) : false);
