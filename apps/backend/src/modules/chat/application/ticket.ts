import type { Member, Role } from './ports';

// A short-lived ticket for the chat socket (docs/07): a browser WebSocket cannot send the
// Telegram signature, so the signed API call gives a ticket and the socket shows it.
export const TICKET_SECONDS = 60;
type Payload = { readonly key: string; readonly member: Member; readonly exp: number };

const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));

const keyOf = (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(`chat-ticket:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

export async function signTicket(secret: string, key: string, member: Member, now: number): Promise<string> {
  const payload: Payload = { key, member, exp: Math.floor(now / 1000) + TICKET_SECONDS };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await keyOf(secret), encoder.encode(body)),
  );
  return `${body}.${toBase64Url(signature)}`;
}

const ROLES: readonly Role[] = ['passenger', 'driver'];

// The member of this chat the ticket was given to, or null: a wrong, old or other chat's ticket.
export async function verifyTicket(
  secret: string,
  key: string,
  ticket: string,
  now: number,
): Promise<Member | null> {
  const [body, signature] = ticket.split('.');
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await keyOf(secret),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Payload;
    if (payload.key !== key || payload.exp < Math.floor(now / 1000)) return null;
    return ROLES.includes(payload.member.role) ? payload.member : null;
  } catch {
    return null;
  }
}
