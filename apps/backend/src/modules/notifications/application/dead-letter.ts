import type { NotificationJob } from './job';

const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
const ADD = 'INSERT INTO dead_notifications (bot, chat_id, text, reason, at) VALUES (?, ?, ?, ?, ?)';
const PURGE = 'DELETE FROM dead_notifications WHERE at < ?';

// A message after the last try of the queue is kept 30 days for the team; older ones go (G42).
export async function keepDead(
  db: D1Database | undefined,
  job: NotificationJob,
  reason: string,
  now: number,
) {
  console.error(JSON.stringify({ event: 'notification_dead', bot: job.bot, reason }));
  if (!db) return;
  await db.batch([
    db.prepare(ADD).bind(job.bot, job.chatId, job.text, reason, now),
    db.prepare(PURGE).bind(now - KEEP_MS),
  ]);
}
