import { readTicket, signTicket as sign } from '../../../shared/auth/signed-ticket';
import type { Member, Role } from './ports';

// The ticket of a chat socket (docs/07): which chat, and who of its two members.
const PURPOSE = 'chat-ticket';
type Payload = { readonly key: string; readonly member: Member };
const ROLES: readonly Role[] = ['passenger', 'driver'];

export const signTicket = (secret: string, key: string, member: Member, now: number) =>
  sign(secret, PURPOSE, { key, member } satisfies Payload, now);

// The member of this chat the ticket was given to, or null: a wrong, old or other chat's ticket.
export async function verifyTicket(
  secret: string,
  key: string,
  ticket: string,
  now: number,
): Promise<Member | null> {
  const payload = (await readTicket(secret, PURPOSE, ticket, now)) as Payload | null;
  if (!payload || payload.key !== key) return null;
  return ROLES.includes(payload.member.role) ? payload.member : null;
}
