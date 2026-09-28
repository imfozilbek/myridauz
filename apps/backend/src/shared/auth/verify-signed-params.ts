import { safeEqual } from '../http/safe-equal';

// Checks data signed by Telegram with a bot token: Mini App initData and the requestContact answer.
// Algorithm: core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
type SignatureFailure = 'auth.invalid' | 'auth.expired';
export type SignedParams =
  | { readonly ok: true; readonly fields: ReadonlyMap<string, string> }
  | { readonly ok: false; readonly error: SignatureFailure };

const KEY_SALT = 'WebAppData';
const SECOND = 1000;
const encoder = new TextEncoder();

async function hmac(key: BufferSource, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export async function signParams(fields: ReadonlyMap<string, string>, botToken: string): Promise<string> {
  const checkString = [...fields]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = await hmac(encoder.encode(KEY_SALT), botToken);
  return toHex(await hmac(secret, checkString));
}

type VerifyOptions = { readonly botToken: string; readonly now: number; readonly maxAgeSeconds: number };

export async function verifySignedParams(raw: string, options: VerifyOptions): Promise<SignedParams> {
  const params = new URLSearchParams(raw);
  const hash = params.get('hash');
  params.delete('hash');
  const fields = new Map(params);
  if (!hash || fields.size === 0) return { ok: false, error: 'auth.invalid' };
  if (!safeEqual(await signParams(fields, options.botToken), hash))
    return { ok: false, error: 'auth.invalid' };
  const authDate = Number(fields.get('auth_date'));
  if (!Number.isInteger(authDate) || options.now - authDate * SECOND > options.maxAgeSeconds * SECOND) {
    return { ok: false, error: 'auth.expired' };
  }
  return { ok: true, fields };
}
