import { app } from './app';
import { initDataFor, signTelegramData } from './shared/auth/test-signing';
import { localUsers } from './modules/users';

// Test helper: calls the assembled app as a Mini App does, signed like Telegram (docs/32).
export const testEnv = {
  PASSENGER_BOT_TOKEN: '1:passenger',
  DRIVER_BOT_TOKEN: '2:driver',
  ADMIN_BOT_TOKEN: '3:admin',
  ADMIN_TELEGRAM_IDS: '900',
};
export const nowSeconds = () => Math.floor(Date.now() / 1000);
export const initData = (id: number, token = testEnv.PASSENGER_BOT_TOKEN, authDate = nowSeconds()) =>
  initDataFor(token, id, authDate);

const TOKENS: Readonly<Record<string, string>> = {
  passenger: testEnv.PASSENGER_BOT_TOKEN,
  driver: testEnv.DRIVER_BOT_TOKEN,
  admin: testEnv.ADMIN_BOT_TOKEN,
};

export async function call(
  path: string,
  id: number,
  // env: bindings on top of the test ones, like a fake Durable Object namespace.
  { env, ...init }: RequestInit & { app?: string; data?: string; env?: object } = {},
) {
  const miniApp = init.app ?? 'passenger';
  const headers = new Headers(init.headers);
  headers.set('authorization', `tma ${init.data ?? (await initData(id, TOKENS[miniApp]))}`);
  headers.set('x-mini-app', miniApp);
  return app.request(path, { ...init, headers }, { ...testEnv, ...env });
}

export async function registerUser(id: number) {
  const contact = await signTelegramData(
    testEnv.PASSENGER_BOT_TOKEN,
    { contact: { user_id: id, phone_number: `99890${id}` } },
    nowSeconds(),
  );
  const body = JSON.stringify({ consent: true, firstName: 'Ali', gender: 'male', contact });
  return call('/me/registration', id, {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

// The public id of a registered test person: the apps and the paths use it (docs/65 A3).
export const pid = async (id: number) => (await localUsers.find(id))?.publicId ?? 'none';
