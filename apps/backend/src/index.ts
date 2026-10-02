import { app } from './app';
import { closeDepartedPosts } from './module-events';
import { askForRatings } from './modules/ratings';
import { checkStatsAlerts } from './modules/stats';
import type { Bindings } from './env';
import { erasePastPoints, expireBookings } from './modules/bookings';
import { bookingsUnderComplaint } from './modules/complaints';
import { consumeNotifications, type NotificationJob } from './modules/notifications';
import { decisionsBetween, grantMissedBonuses } from './modules/drivers';
import { sendTeamDigest } from './modules/assignments';
import { purgeSupport } from './modules/support';
import { expireRequests } from './modules/ride-requests';
import { sendReminders } from './modules/reminders';
import { sendWaitingSubscriptions } from './modules/route-subscriptions';
import { completeTrips } from './modules/trips';
import { burnBonuses } from './modules/wallet';
import { useTelegramApi } from './shared/telegram/api-url';

// The chat of a booking is a Durable Object class of this Worker (docs/07).
export { ChatRoom } from './modules/chat/infrastructure/chat-room';
// The personal channel of a person: live updates of the screens (docs/64, G19).
export { UserFeed } from './modules/feed/infrastructure/user-feed';

// Cloudflare Worker entry point: the API, and the Cron job that closes trips, requests and bookings
// whose time is over, burns bonuses that are over, gives bonus 1 to approved drivers without it,
// sends waiting subscription messages and trip reminders, edits channel posts of trips that left,
// asks both sides of ended rides for a rating, checks the signals of the dashboard once an hour,
// erases the points of rides 30 days after the trip (docs/12, docs/15, docs/24, docs/29, docs/35,
// docs/69, G10, G11, G12, G24).
export default {
  fetch: (request, env, context) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    return app.fetch(request, env, context);
  },
  // Bot messages wait in the queue and go out at Telegram's pace (docs/03).
  queue: (batch, env) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    return consumeNotifications(batch, env);
  },
  scheduled: async (_controller, env, context) => {
    useTelegramApi(env.TELEGRAM_API_URL);
    const now = Date.now();
    context.waitUntil(
      Promise.all([
        completeTrips(env, now),
        expireRequests(env, now),
        expireBookings(env, now),
        bookingsUnderComplaint(env).then((complained) => erasePastPoints(env, now, complained)),
        burnBonuses(env),
        grantMissedBonuses(env),
        sendWaitingSubscriptions(env),
        sendReminders(env, now),
        closeDepartedPosts(env),
        askForRatings(env),
        checkStatsAlerts(env, new Date(now)),
        sendTeamDigest(env, (from, to) => decisionsBetween(env, from, to)),
        purgeSupport(env, now),
      ]),
    );
  },
} satisfies ExportedHandler<Bindings, NotificationJob>;
