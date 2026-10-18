import { showMissingBotKeys } from './bots/bot-keys';
import { setupBotsWhenChanged } from './bots/bot-setup-job';
import { postChannelWelcomes } from './bots/channel-welcome';
import type { Job } from './cron-jobs';
import type { Bindings } from './env';
import { closeDepartedPosts, sendChannelSummaries, showChannelBoards } from './module-events';
import { checkChannelHealth } from './modules/channels';
import { keepTelegramLooks } from './modules/looks';
import { erasePastPoints, expireBookings } from './modules/bookings';
import { bookingsUnderComplaint } from './modules/complaints';
import { decisionsBetween, grantMissedBonuses, waitingApplications } from './modules/drivers';
import { sendApplicationReminders, sendDaySummary } from './modules/assignments';
import { forgetOldCards } from './modules/notifications';
import { askForRatings } from './modules/ratings';
import { sendReminders, watchLateDepartures } from './modules/reminders';
import { showQueue } from './modules/team-queue';
import { expireRequests } from './modules/ride-requests';
import { endSubscriptions } from './modules/route-subscriptions';
import { checkStatsAlerts, dayNumbers } from './modules/stats';
import { purgeSupport } from './modules/support';
import { completeTrips } from './modules/trips';
import { burnBonuses, warnBonusEnd } from './modules/wallet';
import { refreshWaitlistCards, tellOpenedDirections } from './modules/waitlist';
import { TICK_MINUTES } from './shared/cron/tick';

// The Cron of wrangler.toml runs every 15 minutes. The first tick of an hour also runs the hourly
// jobs, and the first tick of DAILY_HOUR_UTC (05:00 in Tashkent, the quietest hour) the daily ones:
// a rare job does not read D1 96 times a day (G56, docs/117).
const DAILY_HOUR_UTC = 0;
// The looks of the channels run at half past the hour: the hourly jobs of the first tick
// already spend part of the requests of a run (docs/117, docs/180).
const LOOKS_MINUTE = 30;

// Closes trips, requests and bookings whose time is over, sends trip reminders, asks a driver who
// forgot «Yoʻlga chiqdim» and departs the trip later, edits channel posts of trips that left and the
// boards of the day, reminds the team of waiting driver applications and keeps the minutes of
// «Navbat» fresh; tells the waiting people of opened directions and refreshes the cards of the list
// on Monday, a few at a time; sets the bots up again when their tokens or texts changed; posts the
// welcomes of the bots to the channels, a few at a time (docs/15, docs/35, docs/122, docs/176,
// docs/181, G10, G34, G63, G68, G83).
const everyTick = (env: Bindings, now: number): Job[] => [
  ['setupBots', () => setupBotsWhenChanged(env, (input, init) => fetch(input, init), now)],
  ['postChannelWelcomes', () => postChannelWelcomes(env, (input, init) => fetch(input, init), now)],
  ['completeTrips', () => completeTrips(env, now)],
  ['expireRequests', () => expireRequests(env, now)],
  ['expireBookings', () => expireBookings(env, now)],
  ['sendReminders', () => sendReminders(env, now)],
  ['watchLateDepartures', () => watchLateDepartures(env, now)],
  ['closeDepartedPosts', () => closeDepartedPosts(env)],
  ['showChannelBoards', () => showChannelBoards(env)],
  ['sendApplicationReminders', () => sendApplicationReminders(env, () => waitingApplications(env))],
  ['showTeamQueue', () => showQueue(env)],
  ['tellOpenedDirections', () => tellOpenedDirections(env)],
  ['refreshWaitlistCards', () => refreshWaitlistCards(env)],
];

// Ends subscriptions whose time is over, sends the summaries of the channels (22:00, Monday), burns
// bonuses that are over, asks both sides of ended rides for a rating, checks the signals of the
// dashboard, erases the points of rides 30 days after the trip, sends the summary of the day to the
// owner at 21:00, reads a few channels again for «Kanallar», shows each bot without its key in
// «Statistika» (docs/12, docs/24, docs/29, docs/69, docs/92, docs/122, G11, G12, G24, G68, G75, lesson 331).
const everyHour = (env: Bindings, now: number): Job[] => [
  ['endSubscriptions', () => endSubscriptions(env)],
  ['sendChannelSummaries', () => sendChannelSummaries(env)],
  ['burnBonuses', () => burnBonuses(env)],
  ['askForRatings', () => askForRatings(env)],
  ['checkStatsAlerts', () => checkStatsAlerts(env)],
  ['checkChannelHealth', () => checkChannelHealth(env)],
  ['showMissingBotKeys', async () => showMissingBotKeys(env)],
  ['erasePastPoints', async () => erasePastPoints(env, now, await bookingsUnderComplaint(env))],
  [
    'sendDaySummary',
    () =>
      sendDaySummary(env, {
        decisions: (from, to) => decisionsBetween(env, from, to),
        numbers: (since) => dayNumbers(env, since),
      }),
  ],
];

// Gives bonus 1 to approved drivers without it, tells the drivers whose bonus ends in 3 days,
// deletes old support messages and forgets the live cards of the bots nobody changed for a month
// (docs/12, docs/122, G32, G68).
const everyDay = (env: Bindings, now: number): Job[] => [
  ['grantMissedBonuses', () => grantMissedBonuses(env)],
  ['warnBonusEnd', () => warnBonusEnd(env)],
  ['purgeSupport', () => purgeSupport(env, now)],
  ['forgetOldCards', () => forgetOldCards(env, now)],
];

// The names, the texts and the pictures of the channels come from the repository (G82).
const everyHalfPast = (env: Bindings): Job[] => [['keepTelegramLooks', () => keepTelegramLooks(env)]];

// The jobs of the tick at `now`.
export function cronJobs(env: Bindings, now: number): Job[] {
  const at = new Date(now);
  const every = env.CRON_TIERS === 'off';
  const hourly = every || at.getUTCMinutes() < TICK_MINUTES;
  const daily = every || (hourly && at.getUTCHours() === DAILY_HOUR_UTC);
  const minute = at.getUTCMinutes() - LOOKS_MINUTE;
  const halfPast = every || (minute >= 0 && minute < TICK_MINUTES);
  return [
    ...everyTick(env, now),
    ...(hourly ? everyHour(env, now) : []),
    ...(daily ? everyDay(env, now) : []),
    ...(halfPast ? everyHalfPast(env) : []),
  ];
}
