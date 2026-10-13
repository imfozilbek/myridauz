import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { setupRoutes } from './setup-routes';

const brand = loadBrand();
const env = {
  PASSENGER_BOT_TOKEN: 'p',
  DRIVER_BOT_TOKEN: 'd',
  ADMIN_BOT_TOKEN: 'a',
  SUPPORT_BOT_TOKEN: 's',
  TELEGRAM_WEBHOOK_SECRET: 'hook',
};

type Call = { url: string; body: Record<string, unknown> };

function setup(secret: string, status = 200, extra = {}) {
  const calls: Call[] = [];
  const routes = setupRoutes(async (url, init) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return new Response('{}', { status });
  });
  const request = routes.request(
    '/telegram/setup',
    { method: 'POST', headers: { 'x-setup-secret': secret } },
    { ...env, ...extra },
  );
  return { request, calls };
}

describe('POST /telegram/setup', () => {
  it('points every bot at the API with the secret token and sets menu buttons for public bots', async () => {
    const { request, calls } = setup('hook');
    const bots = ['passenger', 'driver', 'admin', 'support'];
    expect(await (await request).json()).toEqual({ configured: bots });
    const webhooks = calls.filter((call) => call.url.endsWith('/setWebhook'));
    expect(webhooks.map((call) => call.body.url)).toEqual(
      bots.map((role) => `https://api.${brand.domain}/telegram/${role}`),
    );
    expect(webhooks.every((call) => call.body.secret_token === 'hook')).toBe(true);
    const menus = calls.filter((call) => call.url.endsWith('/setChatMenuButton'));
    expect(menus.map((call) => call.url)).toEqual([
      'https://api.telegram.org/botp/setChatMenuButton',
      'https://api.telegram.org/botd/setChatMenuButton',
    ]);
    // The owner named the menu button «ilova» (03.10.2026): the setup must not rename it.
    expect(menus.map((call) => (call.body.menu_button as { text: string }).text)).toEqual(['ilova', 'ilova']);
    const commands = calls.filter((call) => call.url.endsWith('/setMyCommands'));
    expect(commands.map((call) => call.url)).toEqual([
      'https://api.telegram.org/botp/setMyCommands',
      'https://api.telegram.org/botd/setMyCommands',
    ]);
    expect(commands[0]?.body.commands).toContainEqual({
      command: 'hujjatlar',
      description: 'Hujjatlar: oferta va maxfiylik',
    });
  });

  it('points the bot of the posts at the API for the joins and leaves only (docs/176)', async () => {
    const { request, calls } = setup('hook', 200, { POSTER_BOT_TOKEN: 'c' });
    expect(((await (await request).json()) as { configured: string[] }).configured).toContain('poster');
    const poster = calls.filter((call) => call.url.startsWith('https://api.telegram.org/botc/'));
    expect(poster.map((call) => call.url)).toEqual(['https://api.telegram.org/botc/setWebhook']);
    expect(poster[0]?.body).toMatchObject({
      url: `https://api.${brand.domain}/telegram/poster`,
      secret_token: 'hook',
      allowed_updates: ['chat_member'],
    });
  });

  it('refuses without the secret', async () => {
    const { request, calls } = setup('nope');
    expect((await request).status).toBe(401);
    expect(calls).toEqual([]);
  });

  it('leaves the names, the texts and the pictures of the bots to the looks (docs/180)', async () => {
    const { request, calls } = setup('hook');
    await request;
    const looks = ['setMyName', 'setMyDescription', 'setMyShortDescription', 'setMyProfilePhoto'];
    expect(calls.filter((call) => looks.some((method) => call.url.endsWith(`/${method}`)))).toEqual([]);
  });

  it('reports a failed Telegram call without the token', async () => {
    const { request } = setup('hook', 400);
    const response = await request;
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('botp');
  });
});
