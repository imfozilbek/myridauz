import { app } from './app';
import { runJobs } from './cron-jobs';
import { recordServerEvent } from './modules/analytics';
import { cronJobs } from './cron';
import type { Bindings } from './env';
import { consumeNotifications, type NotificationJob } from './modules/notifications';
import { useTelegramApi } from './shared/telegram/api-url';

// The chat of a booking is a Durable Object class of this Worker (docs/07).
export { ChatRoom } from './modules/chat/infrastructure/chat-room';
// The personal channel of a person: live updates of the screens (docs/64, G19).
export { UserFeed } from './modules/feed/infrastructure/user-feed';

// Cloudflare Worker entry point: the API, the queue of bot messages and the Cron (src/cron.ts).
export default {
  fetch: (request, env, context) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    return app.fetch(request, env, context);
  },
  // The bot messages Telegram asked to wait for, and big batches, at Telegram's pace (docs/03, G56).
  queue: (batch, env) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    return consumeNotifications(batch, env);
  },
  scheduled: async (_controller, env, context) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    const now = Date.now();
    const run = async () => {
      const failed = await runJobs(cronJobs(env, now));
      // A broken job is counted on the dashboard like any server error (G42).
      for (const job of failed) recordServerEvent(env, { name: 'server_error', code: `cron:${job}` });
    };
    context.waitUntil(run());
  },
} satisfies ExportedHandler<Bindings, NotificationJob>;
