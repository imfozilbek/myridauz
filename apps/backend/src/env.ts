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
  readonly NOTIFICATIONS?: Queue<NotificationJob>;
  readonly PASSENGER_BOT_TOKEN?: string;
  readonly DRIVER_BOT_TOKEN?: string;
  readonly ADMIN_BOT_TOKEN?: string;
  readonly TELEGRAM_WEBHOOK_SECRET?: string;
  // Comma separated Telegram ids of the team: a secret, the repository is public (docs/32).
  readonly ADMIN_TELEGRAM_IDS?: string;
  // "true" makes an avatar required for passengers too (docs/05). Brand setting in wrangler.toml.
  readonly PASSENGER_AVATAR_REQUIRED?: string;
  // "on" posts new trips to the channels (docs/15). Off until the owner approves the post (docs/33).
  readonly CHANNEL_POSTS?: string;
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
