import type { ComplaintsDeps, Side } from './ports';

const DAY_MS = 24 * 60 * 60 * 1000;

// Who blocks, whom and why. byOwner: only the owner blocks a member of the team (docs/02, docs/65 A5).
export type BlockOrder = {
  readonly userId: number;
  readonly days: number | null;
  readonly by: number;
  readonly byOwner: boolean;
  readonly reason: string;
  readonly side: Side;
};

// The one way to block, from a complaint or from the admin app (docs/17): the block by id and phone
// with its journal line, every live trip, booking, request and offer of the person cancelled, and
// a bot message to the person.
export async function blockPerson(deps: ComplaintsDeps, order: BlockOrder): Promise<'ok' | 'auth.not_owner'> {
  if (!order.byOwner && (await deps.isTeam(order.userId))) return 'auth.not_owner';
  await deps.people.block(order.userId, order.days, { by: order.by, reason: order.reason });
  await deps.cancelAll(order.userId);
  const until = order.days === null ? null : deps.now() + order.days * DAY_MS;
  await deps.tell.blocked(order.userId, order.side, until);
  return 'ok';
}
