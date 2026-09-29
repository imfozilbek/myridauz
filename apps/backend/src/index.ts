import { app } from './app';
import { closeDepartedPosts } from './module-events';
import { askForRatings } from './modules/ratings';
import { checkStatsAlerts } from './modules/stats';
import type { Bindings } from './env';
import { expireBookings } from './modules/bookings';
import { consumeNotifications, type NotificationJob } from './modules/notifications';
import { grantMissedBonuses } from './modules/drivers';
import { expireRequests } from './modules/ride-requests';
import { sendReminders } from './modules/reminders';
import { sendWaitingSubscriptions } from './modules/route-subscriptions';
import { completeTrips } from './modules/trips';
import { burnBonuses } from './modules/wallet';

// The chat of a booking is a Durable Object class of this Worker (docs/07).
export { ChatRoom } from './modules/chat/infrastructure/chat-room';

// Cloudflare Worker entry point: the API, and the Cron job that closes trips, requests and bookings
// whose time is over, burns bonuses that are over, gives bonus 1 to approved drivers without it,
// sends waiting subscription messages and trip reminders, edits channel posts of trips that left,
// asks both sides of ended rides for a rating, checks the signals of the dashboard once an hour
// (docs/12, docs/15, docs/24, docs/29, docs/35, G10, G11, G12).
export default {
  fetch: app.fetch,
  // Bot messages wait in the queue and go out at Telegram's pace (docs/03).
  queue: consumeNotifications,
  scheduled: async (_controller, env, context) => {
    const now = Date.now();
    context.waitUntil(
      Promise.all([
        completeTrips(env, now),
        expireRequests(env, now),
        expireBookings(env, now),
        burnBonuses(env),
        grantMissedBonuses(env),
        sendWaitingSubscriptions(env),
        sendReminders(env, now),
        closeDepartedPosts(env),
        askForRatings(env),
        checkStatsAlerts(env, new Date(now)),
      ]),
    );
  },
} satisfies ExportedHandler<Bindings, NotificationJob>;
