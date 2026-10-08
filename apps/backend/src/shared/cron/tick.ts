// The Cron of wrangler.toml runs every 15 minutes (cron.ts). A job that reads a window of time takes
// one more tick in it: a late or failed tick misses nothing (G63).
export const TICK_MINUTES = 15;
