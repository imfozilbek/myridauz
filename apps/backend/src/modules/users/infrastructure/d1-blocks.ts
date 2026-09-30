import type { UserRepository } from '../application/ports';
import type { Block, BlockEntry } from '../domain/user';

type Blocks = Pick<
  UserRepository,
  | 'phoneBlock'
  | 'blockPhone'
  | 'idBlock'
  | 'blockId'
  | 'unblockId'
  | 'unblockPhone'
  | 'holdPhone'
  | 'heldPhone'
  | 'releasePhone'
  | 'logBlock'
  | 'blockLog'
>;
type LogRow = {
  user_id: number;
  blocked_until: number | null;
  blocked_by: number;
  reason: string;
  created_at: number;
};

// Blocks by phone and by id, held phones and the block journal (migrations/0002, 0019).
export const d1Blocks = (db: D1Database): Blocks => ({
  phoneBlock: async (phone) => {
    const row = await db
      .prepare('SELECT blocked_until FROM blocked_phones WHERE phone = ?')
      .bind(phone)
      .first<{ blocked_until: number | null }>();
    return row ? { until: row.blocked_until } : null;
  },
  blockPhone: async (phone, block, at) => {
    await db
      .prepare('INSERT OR REPLACE INTO blocked_phones (phone, blocked_until, created_at) VALUES (?, ?, ?)')
      .bind(phone, block.until, at)
      .run();
  },
  // A deleted row too: deleted_at is not looked at.
  idBlock: async (id) => {
    const row = await db
      .prepare('SELECT blocked, blocked_until FROM users WHERE id = ?')
      .bind(id)
      .first<{ blocked: number; blocked_until: number | null }>();
    return row?.blocked ? ({ until: row.blocked_until } satisfies Block) : null;
  },
  blockId: async (id, block, at) => {
    await db
      .prepare('UPDATE users SET blocked = 1, blocked_until = ?, updated_at = ? WHERE id = ?')
      .bind(block.until, at, id)
      .run();
  },
  unblockId: async (id, at) => {
    await db
      .prepare('UPDATE users SET blocked = 0, blocked_until = NULL, updated_at = ? WHERE id = ?')
      .bind(at, id)
      .run();
  },
  unblockPhone: async (phone) => {
    await db.prepare('DELETE FROM blocked_phones WHERE phone = ?').bind(phone).run();
  },
  holdPhone: async (id, phone, at) => {
    await db
      .prepare('INSERT OR REPLACE INTO held_phones (user_id, phone, held_at) VALUES (?, ?, ?)')
      .bind(id, phone, at)
      .run();
  },
  heldPhone: async (id) =>
    (await db.prepare('SELECT phone FROM held_phones WHERE user_id = ?').bind(id).first<{ phone: string }>())
      ?.phone ?? null,
  releasePhone: async (id) => {
    await db.prepare('DELETE FROM held_phones WHERE user_id = ?').bind(id).run();
  },
  logBlock: async (entry) => {
    await db
      .prepare(
        'INSERT INTO block_log (user_id, blocked_until, blocked_by, reason, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(entry.userId, entry.until, entry.by, entry.reason, entry.at)
      .run();
  },
  blockLog: async (id) =>
    (
      await db.prepare('SELECT * FROM block_log WHERE user_id = ? ORDER BY id').bind(id).all<LogRow>()
    ).results.map((row): BlockEntry => ({
      userId: row.user_id,
      until: row.blocked_until,
      by: row.blocked_by,
      reason: row.reason,
      at: row.created_at,
    })),
});
