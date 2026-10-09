import { z } from 'zod';

// The journal of the team (G75, gap К of docs/158): every decision and change of a member, one list.
// The owner reads it; a member reads the numbers of the own day from it.
export const ADMIN_JOURNAL_PATH = '/admin/journal';
export const ADMIN_WORK_PATH = '/admin/me/work';
export const JOURNAL_KINDS = [
  'application',
  'complaint',
  'face',
  'block',
  'unblock',
  'refund',
  'team',
] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];

const count = z.number().int().nonnegative();

export const journalSchema = z.object({
  entries: z.array(
    z.object({
      member: z.string().max(64),
      kind: z.enum(JOURNAL_KINDS),
      // The public id of the person, or the id of the complaint.
      subject: z.string().max(64),
      // approve, reject, request_changes; none, warning, block:7; confirm, reject; add, remove.
      action: z.string().max(32),
      at: z.number().int(),
    }),
  ),
});
export type Journal = z.infer<typeof journalSchema>;

// «Bugun qildingiz, kutmoqda, oʻrtacha, 30 daqiqadan oshgan» of a member (mockup g67/1).
export const workSchema = z.object({ done: count, waiting: count, averageMinutes: count, over: count });
export type Work = z.infer<typeof workSchema>;
