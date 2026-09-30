import { readTicket, signTicket as sign } from '../../../shared/auth/signed-ticket';

// The ticket of a chat socket (docs/07): which chat, and who got it. The browser can read a
// ticket, so it carries only the own id, never the other person's Telegram ID (docs/65 A3).
const PURPOSE = 'chat-ticket';
type Payload = { readonly key: string; readonly userId: number };

export const signTicket = (secret: string, key: string, userId: number, now: number) =>
  sign(secret, PURPOSE, { key, userId } satisfies Payload, now);

// Who of this chat the ticket was given to, or null: a wrong, old or other chat's ticket.
export async function verifyTicket(
  secret: string,
  key: string,
  ticket: string,
  now: number,
): Promise<number | null> {
  const payload = (await readTicket(secret, PURPOSE, ticket, now)) as Payload | null;
  if (!payload || payload.key !== key) return null;
  return Number.isInteger(payload.userId) ? payload.userId : null;
}
