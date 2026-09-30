import type { BlockJournal } from '@platform/contracts';
import type { ComplaintsDeps } from './ports';

const reasonOf = (reason: string): BlockJournal['entries'][number]['reason'] =>
  reason === 'unblock' ? 'unblock' : reason.startsWith('complaint:') ? 'complaint' : 'admin';

// The team sees the block now and every block before it, with the name of who did it (docs/65 C).
export async function blockJournal(deps: ComplaintsDeps, userId: number): Promise<BlockJournal> {
  const { active, entries } = await deps.people.blocks(userId);
  const names = new Map<number, string>();
  for (const entry of entries)
    if (!names.has(entry.by)) names.set(entry.by, (await deps.people.find(entry.by))?.firstName ?? '');
  return {
    active,
    entries: entries.map((entry) => ({
      until: entry.until,
      reason: reasonOf(entry.reason),
      by: names.get(entry.by) ?? '',
      at: entry.at,
    })),
  };
}
