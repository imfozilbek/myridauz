import { CHATS_UNREAD_PATH, MY_CHANNELS_PATH } from '@platform/contracts';
import { Hono } from 'hono';
import { setupRoutes } from './bots/setup-routes';
import { webhookRoutes } from './bots/webhook-routes';
import type { AppEnv } from './env';
import './account-deletion';
import './module-events';
import './board-events';
import { analyticsModule } from './modules/analytics';
import {
  bookingForShare,
  bookingsModule,
  chatAboutOf,
  chatMemberOf,
  tripCancelWatch,
} from './modules/bookings';
import { callsModule, callsReady } from './modules/calls';
import { channelsModule, publicityModule, zoneWatch } from './modules/channels';
import { chatRoutes } from './modules/chat';
import { companyModule } from './modules/company';
import { soundsModule } from './modules/sounds';
import { complaintsModule } from './modules/complaints';
import { avatarWatch, driversModule } from './modules/drivers';
import { favoritesModule } from './modules/favorites';
import { feedRoutes } from './modules/feed';
import { healthModule } from './modules/health';
import { historyModule } from './modules/history';
import { locationsModule } from './modules/locations';
import { mapModule } from './modules/map';
import { pitaksModule } from './modules/pitaks';
import { pricingModule } from './modules/pricing';
import { ratingsModule } from './modules/ratings';
import { requestsModule } from './modules/ride-requests';
import { subscriptionsModule } from './modules/route-subscriptions';
import { statsModule } from './modules/stats';
import { attentionModule } from './modules/team-queue';
import { journalModule } from './modules/journal';
import { peopleModule } from './modules/people';
import { sharesModule } from './modules/shares';
import { teamModule, teamRole } from './modules/team';
import { tripFacts, tripForFamily, tripsModule } from './modules/trips';
import { blockedGuard, usersModule } from './modules/users';
import { walletModule } from './modules/wallet';
import { telegramAuth } from './shared/auth/telegram-auth';
import { allowMap, allowMiniApps, allowPublic } from './shared/http/cors';
import { notFound, onServerError } from './shared/http/errors';
import { rateLimit } from './shared/http/rate-limit';

// The clock is read at each request, not kept from the start: tests set their own time (lesson 76).
const auth = telegramAuth(() => Date.now(), teamRole);

export const app = new Hono<AppEnv>()
  .use('/analytics', allowMiniApps, rateLimit('ANALYTICS_LIMIT', 'analytics'))
  // CORS goes first: a browser preflight carries no Telegram signature.
  // "/me/*" also matches "/me".
  .use('/me/*', allowMiniApps, auth)
  .use('/users/*', allowMiniApps, auth)
  .use('/driver/*', allowMiniApps, auth, blockedGuard)
  .use('/admin/*', allowMiniApps, auth, blockedGuard)
  .use('/prices/*', allowMiniApps, auth, blockedGuard)
  .use('/passenger/*', allowMiniApps, auth, blockedGuard)
  .use('/pitaks/*', allowMiniApps, auth, blockedGuard)
  .use('/trips', allowMiniApps, auth, blockedGuard)
  .use('/trips/*', allowMiniApps, auth, blockedGuard)
  .use('/reviews/*', allowMiniApps, auth, blockedGuard)
  .use('/reviews', allowMiniApps, auth, blockedGuard)
  .use('/complaints', allowMiniApps, auth, blockedGuard)
  // The chat ticket needs the signature; the socket itself shows the ticket instead (docs/07).
  .use('/chats/:key/ticket', allowMiniApps, auth, blockedGuard)
  .use('/chats/:key/about', allowMiniApps, auth, blockedGuard)
  // The sheet «Yangi xabar» (G68): the unread chats and a ready answer without the socket.
  .use(CHATS_UNREAD_PATH, allowMiniApps, auth, blockedGuard)
  .use('/chats/:key/messages', allowMiniApps, auth, blockedGuard)
  .use('/calls/*', allowMiniApps, auth, blockedGuard)
  // The personal channel: the same ticket way as the chat (docs/64).
  .use('/feed/ticket', allowMiniApps, auth, blockedGuard)
  // Close people read a shared trip without registration; "Xabar olish" needs the signature (docs/43).
  .use('/shared/*', allowMiniApps)
  .use('/shared/:token/follow', auth)
  // The directory is public: no personal data. Only a change of a distance checks the signature.
  .use('/public/*', allowPublic)
  .use('/locations', allowMiniApps)
  .use('/locations/*', allowMiniApps)
  .use('/map/*', allowMap)
  // Too many actions or searches of one person (G42): the booking, the offer, the tickets, the map.
  .use('/trips/:id/bookings', rateLimit('ACTIONS_LIMIT', 'action', true))
  .use('/driver/requests/:id/offers', rateLimit('ACTIONS_LIMIT', 'action', true))
  .use('/chats/:key/ticket', rateLimit('ACTIONS_LIMIT', 'action'))
  .use('/chats/:key/messages', rateLimit('ACTIONS_LIMIT', 'action'))
  .use('/feed/ticket', rateLimit('ACTIONS_LIMIT', 'action'))
  .use('/passenger/map/search', rateLimit('SEARCH_LIMIT', 'search'))
  // «Kanallar» asks Telegram once a channel (G65).
  .use(MY_CHANNELS_PATH, rateLimit('ACTIONS_LIMIT', 'action'))
  .route('/', healthModule)
  .route('/', analyticsModule)
  // The avatar watch goes before users: it wraps the avatar route of the users module.
  .route('/', avatarWatch)
  .route('/', usersModule)
  .route('/', driversModule)
  .route('/', locationsModule(auth))
  .route('/', mapModule)
  .route('/', pitaksModule)
  .route('/', pricingModule)
  .route('/', companyModule)
  .route('/', soundsModule)
  .route('/', channelsModule)
  .route('/', publicityModule(tripFacts))
  // The cancel and zone watches go before trips: they wrap the routes of the trips module.
  .route('/', tripCancelWatch)
  .route('/', zoneWatch)
  .route('/', tripsModule)
  .route('/', requestsModule)
  .route('/', subscriptionsModule)
  .route('/', favoritesModule)
  .route('/', historyModule)
  .route('/', ratingsModule)
  .route('/', complaintsModule)
  .route('/', statsModule)
  .route('/', attentionModule)
  .route('/', journalModule)
  .route('/', teamModule)
  .route('/', peopleModule)
  .route('/', bookingsModule)
  .route('/', walletModule)
  .route(
    '/',
    chatRoutes(async (env, key, userId) => {
      const member = await chatMemberOf(env, key, userId);
      return member && { ...member, canCall: member.canCall && callsReady(env) };
    }, chatAboutOf),
  )
  .route(
    '/',
    callsModule(async (env, key, userId) => (await chatMemberOf(env, key, userId))?.canCall === true),
  )
  .route('/', feedRoutes)
  .route('/', sharesModule(bookingForShare, tripForFamily))
  // Setup goes before the webhook route: "/telegram/:role" would take "/telegram/setup" as a bot name.
  .route(
    '/',
    setupRoutes((input, init) => fetch(input, init)),
  )
  .route(
    '/',
    webhookRoutes((input, init) => fetch(input, init)),
  )
  .onError(onServerError)
  .notFound(notFound);
