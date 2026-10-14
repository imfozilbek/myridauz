import type { WaitlistInvited, WaitlistRole } from '@platform/contracts';
import type { RecordStore, VisitStore, WaitlistRecord } from './ports';

export type InviteDeps = {
  readonly records: RecordStore;
  readonly visits: VisitStore;
  // The card of the main bot for Telegram's «send to a chat» window, and the plain friend link.
  readonly prepare: (record: WaitlistRecord, code: string) => Promise<WaitlistInvited>;
  readonly now: () => number;
};

// «Doʻstimni chaqiraman» (docs/181): the friend link carries the code of the person (docs/116); the
// first invite is kept for «Roʻyxatdan keyin» of the statistics (docs/183).
export async function invite(
  deps: InviteDeps,
  userId: number,
  role: WaitlistRole,
): Promise<WaitlistInvited | null> {
  const record = (await deps.records.of(userId)).find((one) => one.role === role);
  if (!record) return null;
  const visit = await deps.visits.invited(userId, deps.now());
  return deps.prepare(record, visit.code);
}
