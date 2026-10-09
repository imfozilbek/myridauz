import { CHANNEL_VIA_PREFIX } from '@platform/contracts';

// The people who came to Rida by the posts of a channel (user_arrivals, G55): by the mark of the
// channel, through the index of arrived_at (docs/117).
const BY_VIA = `SELECT via, COUNT(*) AS count FROM user_arrivals
  WHERE arrived_at >= ?1 AND substr(via, 1, ?2) = ?3 GROUP BY via`;

type Row = { via: string; count: number };

export async function arrivalsByChannelVia(db: D1Database, since: number): Promise<Map<string, number>> {
  const prefix = CHANNEL_VIA_PREFIX;
  const { results } = await db.prepare(BY_VIA).bind(since, prefix.length, prefix).all<Row>();
  return new Map(results.map((row) => [row.via, row.count]));
}
