// A short-lived signed ticket for a socket (docs/07, docs/64): a browser WebSocket cannot send the
// Telegram signature, so a signed API call gives a ticket and the socket shows it.
const TICKET_SECONDS = 60;
const SECOND = 1000;

const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));

// Every kind of ticket has its own key: a chat ticket never opens a personal channel.
const keyOf = (secret: string, purpose: string) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(`${purpose}:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

export async function signTicket(
  secret: string,
  purpose: string,
  data: object,
  now: number,
): Promise<string> {
  const body = toBase64Url(
    encoder.encode(JSON.stringify({ data, exp: Math.floor(now / SECOND) + TICKET_SECONDS })),
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', await keyOf(secret, purpose), encoder.encode(body)),
  );
  return `${body}.${toBase64Url(signature)}`;
}

// What the ticket carries, or null: a wrong, old or other kind of ticket. The caller checks the shape.
export async function readTicket(
  secret: string,
  purpose: string,
  ticket: string,
  now: number,
): Promise<unknown> {
  const [body, signature] = ticket.split('.');
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await keyOf(secret, purpose),
      fromBase64Url(signature),
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as {
      data: unknown;
      exp: number;
    };
    return payload.exp < Math.floor(now / SECOND) ? null : payload.data;
  } catch {
    return null;
  }
}
