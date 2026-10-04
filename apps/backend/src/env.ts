import type { MiniApp, TeamRole } from '@platform/contracts';
import type { NotificationJob } from './modules/notifications/application/job';
import type { TelegramUser } from './shared/auth/telegram-fields';

// Cloudflare bindings, vars and secrets of the Worker (brands/<brand>/wrangler.toml).
// Optional ones are absent when running locally and in tests.
export type Bindings = {
  readonly BRAND?: string;
  readonly ANALYTICS?: AnalyticsEngineDataset;
  readonly DB?: D1Database;
  readonly MEDIA?: R2Bucket;
  // One Durable Object per booking chat (docs/07) and the queue of bot messages (docs/03).
  readonly CHATS?: DurableObjectNamespace;
  // One Durable Object per person: "something changed" to the open Mini Apps (docs/64, G19).
  readonly FEEDS?: DurableObjectNamespace;
  readonly NOTIFICATIONS?: Queue<NotificationJob>;
  // Workers Rate Limiting (G42): actions, the map search, the analytics of one person or address.
  readonly ACTIONS_LIMIT?: RateLimit;
  readonly SEARCH_LIMIT?: RateLimit;
  readonly ANALYTICS_LIMIT?: RateLimit;
  readonly PASSENGER_BOT_TOKEN?: string;
  readonly DRIVER_BOT_TOKEN?: string;
  readonly ADMIN_BOT_TOKEN?: string;
  readonly SUPPORT_BOT_TOKEN?: string;
  readonly TELEGRAM_WEBHOOK_SECRET?: string;
  // The Bot API of the local stand (docs/75); unset in production: Telegram itself.
  readonly TELEGRAM_API_URL?: string;
  // Comma separated Telegram ids of the team: a secret, the repository is public (docs/32).
  readonly ADMIN_TELEGRAM_IDS?: string;
  // "true" makes an avatar required for passengers too (docs/05). Brand setting in wrangler.toml.
  readonly PASSENGER_AVATAR_REQUIRED?: string;
  // "on" posts new trips to the channels (docs/15). Off until the owner approves the post (docs/33).
  readonly CHANNEL_POSTS?: string;
  // The dashboard reads Analytics Engine through its SQL API (docs/29): a read-only key and the
  // account are secrets, the dataset is a brand setting in wrangler.toml (docs/46).
  readonly ANALYTICS_API_TOKEN?: string;
  readonly CF_ACCOUNT_ID?: string;
  readonly ANALYTICS_DATASET?: string;
  // Voice calls through Cloudflare Realtime (docs/08, G13): the app and the TURN key, secrets.
  readonly REALTIME_APP_ID?: string;
  readonly REALTIME_APP_SECRET?: string;
  readonly TURN_KEY_ID?: string;
  readonly TURN_KEY_TOKEN?: string;
};

// Set by the Telegram auth middleware for API routes (shared/auth).
type Session = {
  readonly app: MiniApp;
  readonly user: TelegramUser;
  readonly botToken: string;
  readonly isAdmin: boolean;
  // owner or moderator (docs/02); null for everyone else.
  readonly teamRole: TeamRole | null;
};

export type AppEnv = { Bindings: Bindings; Variables: { session: Session } };
