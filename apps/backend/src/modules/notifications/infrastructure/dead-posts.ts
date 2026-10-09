// The channel posts Telegram never took after the last try (dead_notifications, G42): by channel,
// through the index of `at` (docs/117). A channel is a chat named "@username".
const BY_CHANNEL = `SELECT substr(chat_id, 2) AS channel, COUNT(*) AS count FROM dead_notifications
  WHERE at >= ?1 AND substr(chat_id, 1, 1) = '@' GROUP BY chat_id`;

type Row = { channel: string; count: number };

export async function deadPostsByChannel(db: D1Database, since: number): Promise<Map<string, number>> {
  const { results } = await db.prepare(BY_CHANNEL).bind(since).all<Row>();
  return new Map(results.map((row) => [row.channel, row.count]));
}
