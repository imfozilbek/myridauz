import { JOURNAL_KINDS, type JournalKind } from '@platform/contracts';
import type { Action, JournalStore } from '../application/ports';

type Row = {
  member_id: number;
  kind: string;
  subject: string;
  action: string;
  since: number | null;
  at: number;
};

const ADD =
  'INSERT INTO team_actions (member_id, kind, subject, action, since, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)';
// Through the indexes team_actions_at and team_actions_member (docs/117).
const RECENT = 'SELECT * FROM team_actions WHERE at < ?1 ORDER BY at DESC LIMIT ?2';
const OF_MEMBER = 'SELECT * FROM team_actions WHERE member_id = ?1 AND at >= ?2 AND at < ?3 ORDER BY at';

const isKind = (kind: string): kind is JournalKind => (JOURNAL_KINDS as readonly string[]).includes(kind);
const actionOf = (row: Row): Action[] =>
  isKind(row.kind)
    ? [
        {
          memberId: row.member_id,
          kind: row.kind,
          subject: row.subject,
          action: row.action,
          since: row.since,
          at: row.at,
        },
      ]
    : [];

// Table team_actions (migration 0057).
export const d1Journal = (db: D1Database): JournalStore => ({
  add: async ({ memberId, kind, subject, action, since, at }) => {
    await db.prepare(ADD).bind(memberId, kind, subject, action, since, at).run();
  },
  recent: async (before, limit) =>
    (await db.prepare(RECENT).bind(before, limit).all<Row>()).results.flatMap(actionOf),
  ofMember: async (memberId, from, to) =>
    (await db.prepare(OF_MEMBER).bind(memberId, from, to).all<Row>()).results.flatMap(actionOf),
});

// Tests and local runs: the same rules in memory.
export function createMemoryJournal(): JournalStore {
  const actions: Action[] = [];
  return {
    add: async (action) => void actions.push(action),
    recent: async (before, limit) =>
      actions
        .filter((action) => action.at < before)
        .sort((a, b) => b.at - a.at)
        .slice(0, limit),
    ofMember: async (memberId, from, to) =>
      actions.filter((action) => action.memberId === memberId && action.at >= from && action.at < to),
  };
}
