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

const AVATAR_BYTES = new Uint8Array([255, 216, 255]);
type Call = { url: string; body: Record<string, unknown> };

// JSON calls as objects; the avatar upload as its form fields, the file as its size.
const bodyOf = (body: RequestInit['body']): Record<string, unknown> =>
  body instanceof FormData
    ? Object.fromEntries(
        [...body.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : value.size]),
      )
    : (JSON.parse(String(body)) as Record<string, unknown>);

function setup(secret: string, status = 200, avatarStatus = 200) {
  const calls: Call[] = [];
  const routes = setupRoutes(async (url, init) => {
    if (url.startsWith(`https://${brand.domain}/`)) {
      calls.push({ url, body: {} });
      return new Response(AVATAR_BYTES, { status: avatarStatus });
    }
    calls.push({ url, body: bodyOf(init?.body) });
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
      `${brand.name} Yordam`,
    ]);
    const descriptions = sent('setMyDescription').map((call) => String(call.body.description));
    const shorts = sent('setMyShortDescription').map((call) => String(call.body.short_description));
    expect(descriptions).toHaveLength(4);
    expect(descriptions.every((text) => text.length > 0 && text.length <= 512)).toBe(true);
    expect(shorts.every((text) => text.length > 0 && text.length <= 120)).toBe(true);
    expect(shorts[0]).toContain(brand.slogan);
    expect(descriptions[0]).toContain(brand.name);
    expect(shorts[3]).toContain('yordam xizmati');
  });

  it('uploads the picture of every bot from the landing as its profile photo (G34)', async () => {
    const { request, calls } = setup('hook');
    await request;
    const bots = ['passenger', 'driver', 'admin', 'support'];
    const pictures = calls.filter((call) => call.url.endsWith('-avatar.jpg')).map((call) => call.url);
    expect(pictures).toEqual(bots.map((bot) => `https://${brand.domain}/bot/${bot}-avatar.jpg`));
    const photos = calls.filter((call) => call.url.endsWith('/setMyProfilePhoto'));
    expect(photos.map((call) => call.url)).toEqual(
      ['p', 'd', 'a', 's'].map((token) => `https://api.telegram.org/bot${token}/setMyProfilePhoto`),
    );
    expect(photos[0]?.body).toEqual({
      photo: JSON.stringify({ type: 'static', photo: 'attach://avatar' }),
      avatar: AVATAR_BYTES.length,
    });
  });

  it('goes on with the setup when a picture is missing', async () => {
    const { request, calls } = setup('hook', 200, 404);
    expect(await (await request).json()).toEqual({ configured: ['passenger', 'driver', 'admin', 'support'] });
    expect(calls.some((call) => call.url.endsWith('/setMyProfilePhoto'))).toBe(false);
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
