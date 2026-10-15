import type { Bindings } from '../env';
import type { Fetch } from '../shared/telegram/telegram-api';
import { configureBots, setupStamp } from './configure-bots';

// The Cron sets the bots up by itself (G83): after a deploy with a new text or when the owner adds
// the token of a new bot, the next tick gives the bots their webhook, profile and menu. A failed setup
// keeps the old mark, so the next tick tries again.
export async function setupBotsWhenChanged(env: Bindings, fetch: Fetch, now: number): Promise<void> {
  const db = env.DB;
  const secret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!db || !secret) return;
  const stamp = await setupStamp(env);
  const last = await db.prepare('SELECT stamp FROM bot_setup WHERE id = 1').first<{ stamp: string }>();
  if (last?.stamp === stamp) return;
  const configured = await configureBots(env, fetch, secret);
  await db
    .prepare(
      'INSERT INTO bot_setup (id, stamp, done_at) VALUES (1, ?, ?) ON CONFLICT (id) DO UPDATE SET stamp = excluded.stamp, done_at = excluded.done_at',
    )
    .bind(stamp, now)
    .run();
  console.log(JSON.stringify({ event: 'bots_set_up', configured }));
}
