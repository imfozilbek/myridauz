import { COMPLAIN_BELOW_STARS } from '@platform/contracts';
import { complaintReasonsOf } from '../../complaints';
import type { StarsRow, TagRow, VoiceRows } from '../domain/voice';

// The ratings and complaints of a period (G87, docs/191), through the indexes of their time.
const STARS = `SELECT COUNT(*) AS count, COALESCE(SUM(stars), 0) AS total,
  COALESCE(SUM(stars < ?2), 0) AS low FROM reviews WHERE created_at >= ?1`;
const TAGS = `SELECT j.value AS tag, COUNT(*) AS count FROM reviews r, json_each(r.tags) j
  WHERE r.created_at >= ?1 GROUP BY j.value`;
const COMPLAINTS = 'SELECT reason FROM complaints WHERE created_at >= ?1';
const NO_STARS: StarsRow = { count: 0, total: 0, low: 0 };

export const d1Voice =
  (db: D1Database) =>
  async (since: number): Promise<VoiceRows> => {
    const [stars, tags, complaints] = await Promise.all([
      db.prepare(STARS).bind(since, COMPLAIN_BELOW_STARS).first<StarsRow>(),
      db.prepare(TAGS).bind(since).all<TagRow>(),
      db.prepare(COMPLAINTS).bind(since).all<{ reason: string }>(),
    ]);
    return {
      stars: stars ?? NO_STARS,
      tags: tags.results,
      complaints: complaints.results.map((row) => complaintReasonsOf(row.reason)),
    };
  };
