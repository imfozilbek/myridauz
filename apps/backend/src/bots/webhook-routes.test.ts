import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { webhookRoutes } from './webhook-routes';

const brand = loadBrand();
const env = {
  PASSENGER_BOT_TOKEN: 'p',
  ADMIN_BOT_TOKEN: 'a',
  TELEGRAM_WEBHOOK_SECRET: 'hook',
  ADMIN_TELEGRAM_IDS: '7,8',
};
type Reply = { text: string; reply_markup: { inline_keyboard: { web_app: { url: string } }[][] } };
const start = (fromId = 1, text = '/start') => ({
  message: { text, chat: { id: 42 }, from: { id: fromId } },
});

function send(role: string, body: unknown, secret = 'hook', bindings: object = env) {
  const headers = { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret };
  return webhookRoutes.request(
    `/telegram/${role}`,
    { method: 'POST', headers, body: JSON.stringify(body) },
    bindings,
  );
}

describe('POST /telegram/:role', () => {
  it('answers /start with a text and a button that opens the Mini App of the role', async () => {
    const reply = (await (await send('passenger', start())).json()) as Reply;
    expect(reply).toMatchObject({ method: 'sendMessage', chat_id: 42 });
    expect(reply.text).toContain(brand.name);
    expect(reply.reply_markup.inline_keyboard[0]?.[0]).toEqual({
      text: 'Ochish',
      web_app: { url: `https://passenger.${brand.domain}` },
    });
  });

  it('rejects requests without the secret token', async () => {
    expect((await send('passenger', start(), 'wrong')).status).toBe(401);
  });

  it('knows only configured bots', async () => {
    expect((await send('driver', start())).status).toBe(404);
    expect((await send('taxi', start())).status).toBe(404);
    expect((await send('passenger', start(), 'hook', {})).status).toBe(404);
  });

  it('opens the admin Mini App only for the team', async () => {
    const team = (await (await send('admin', start(7))).json()) as Reply;
    expect(team.reply_markup.inline_keyboard[0]?.[0]?.web_app.url).toBe(`https://admin.${brand.domain}`);
    const stranger = await (await send('admin', start(9))).json();
    expect(stranger).toEqual({
      method: 'sendMessage',
      chat_id: 42,
      text: `Bu bot faqat ${brand.name} jamoasi uchun.`,
    });
  });

  it('answers other updates with an empty 200, so Telegram does not retry', async () => {
    expect(await (await send('passenger', start(1, 'salom'))).json()).toEqual({});
    expect(await (await send('passenger', { edited_message: {} })).json()).toEqual({});
    expect((await send('passenger', 'not an update')).status).toBe(200);
  });
});
