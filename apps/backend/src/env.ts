// Cloudflare bindings, vars and secrets of the Worker (brands/<brand>/wrangler.toml).
// Optional ones are absent when running locally and in tests.
export type Bindings = {
  readonly BRAND?: string;
  readonly ANALYTICS?: AnalyticsEngineDataset;
  readonly PASSENGER_BOT_TOKEN?: string;
  readonly DRIVER_BOT_TOKEN?: string;
  readonly ADMIN_BOT_TOKEN?: string;
  readonly TELEGRAM_WEBHOOK_SECRET?: string;
  // Comma separated Telegram ids of the team: a secret, the repository is public (docs/32).
  readonly ADMIN_TELEGRAM_IDS?: string;
};

export type AppEnv = { Bindings: Bindings };
