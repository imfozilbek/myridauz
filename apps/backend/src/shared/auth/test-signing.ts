import { signParams } from './verify-signed-params';

// Test helper: builds data signed like Telegram does, for a bot token of the tests.
export const TEST_NOW = 1_790_000_000_000;
const SECOND = 1000;

export async function signTelegramData(
  token: string,
  fields: Readonly<Record<string, unknown>>,
  authDate = TEST_NOW / SECOND,
): Promise<string> {
  const entries = Object.entries({ ...fields, auth_date: authDate }).map(([key, value]): [string, string] => [
    key,
    typeof value === 'string' ? value : JSON.stringify(value),
  ]);
  const hash = await signParams(new Map(entries), token);
  return new URLSearchParams([...entries, ['hash', hash]]).toString();
}

export const initDataFor = (token: string, id: number, authDate?: number) =>
  signTelegramData(token, { user: { id, first_name: 'Ali', allows_write_to_pm: true } }, authDate);
