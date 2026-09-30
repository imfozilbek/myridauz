import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { setupRoutes } from './setup-routes';

const brand = loadBrand();
const env = {
  PASSENGER_BOT_TOKEN: 'p',
  DRIVER_BOT_TOKEN: 'd',
  ADMIN_BOT_TOKEN: 'a',
  TELEGRAM_WEBHOOK_SECRET: 'hook',
};

function setup(secret: string, status = 200) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const routes = setupRoutes(async (url, init) => {
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    return new Response('{}', { status });
  });
  const request = routes.request(
    '/telegram/setup',
    { method: 'POST', headers: { 'x-setup-secret': secret } },
    env,
  );
  return { request, calls };
}

describe('POST /telegram/setup', () => {
  it('points every bot at the API with the secret token and sets menu buttons for public bots', async () => {
    const { request, calls } = setup('hook');
    expect(await (await request).json()).toEqual({ configured: ['passenger', 'driver', 'admin'] });
    const webhooks = calls.filter((call) => call.url.endsWith('/setWebhook'));
    expect(webhooks.map((call) => call.body.url)).toEqual(
      ['passenger', 'driver', 'admin'].map((role) => `https://api.${brand.domain}/telegram/${role}`),
    );
    expect(webhooks.every((call) => call.body.secret_token === 'hook')).toBe(true);
    const menus = calls.filter((call) => call.url.endsWith('/setChatMenuButton'));
    expect(menus.map((call) => call.url)).toEqual([
      'https://api.telegram.org/botp/setChatMenuButton',
      'https://api.telegram.org/botd/setChatMenuButton',
    ]);
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

  it('gives every bot its name, the text of an empty chat and the profile line in Telegram limits', async () => {
    const { request, calls } = setup('hook');
    await request;
    const sent = (method: string) => calls.filter((call) => call.url.endsWith(`/${method}`));
    expect(sent('setMyName').map((call) => call.body.name)).toEqual([
      brand.name,
      `${brand.name} Haydovchi`,
      `${brand.name} Jamoa`,
    ]);
    const descriptions = sent('setMyDescription').map((call) => String(call.body.description));
    const shorts = sent('setMyShortDescription').map((call) => String(call.body.short_description));
    expect(descriptions).toHaveLength(3);
    expect(descriptions.every((text) => text.length > 0 && text.length <= 512)).toBe(true);
    expect(shorts.every((text) => text.length > 0 && text.length <= 120)).toBe(true);
    expect(shorts[0]).toContain(brand.slogan);
    expect(descriptions[0]).toContain(brand.name);
  });

  it('refuses without the secret', async () => {
    const { request, calls } = setup('nope');
    expect((await request).status).toBe(401);
    expect(calls).toEqual([]);
  });

  it('reports a failed Telegram call without the token', async () => {
    const { request } = setup('hook', 400);
    const response = await request;
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('botp');
  });
});
