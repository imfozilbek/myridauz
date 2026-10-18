import { app } from './app';
import { runJobs } from './cron-jobs';
import { recordServerEvent } from './modules/analytics';
import { cronJobs } from './cron';
import type { Bindings } from './env';
import { consumeNotifications, type QueueMessage } from './modules/notifications';
import { runReminderTask } from './modules/reminders';
import { useTelegramApi } from './shared/telegram/api-url';
import { refreshLimits } from './modules/limits';

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
  // The bot messages Telegram asked to wait for, and big batches, at Telegram's pace (docs/03, G56);
  // the reminders of trips at their minute (G85 R3).
  queue: async (batch, env) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    await refreshLimits(env);
    return consumeNotifications(batch, env, { reminder: runReminderTask });
  },
  // The Cron answers when its jobs are done: the Cron of the stand too, so a scenario never meets the
  // jobs of the Cron before it (lesson 274).
  scheduled: async (_controller, env) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    // The limits the owner set reach the Cron jobs too (G75, docs/128 §4).
    await refreshLimits(env);
    const failed = await runJobs(cronJobs(env, Date.now()));
    // A broken job is counted on the dashboard like any server error (G42).
    for (const job of failed) recordServerEvent(env, { name: 'server_error', code: `cron:${job}` });
  },
} satisfies ExportedHandler<Bindings, QueueMessage>;
