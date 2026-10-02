import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import { localUsers } from '../modules/users';
import { botEnv, botSender, fakeTelegram } from './test-bot';
import { publicIdOf } from '../test-people';

const brand = loadBrand();
type Reply = { text: string; reply_markup: { inline_keyboard: { web_app: { url: string } }[][] } };
const start = (fromId = 1, text = '/start') => ({
  message: { message_id: 1, text, chat: { id: 42 }, from: { id: fromId } },
});

const send = botSender(fakeTelegram().fetch);
const env = botEnv;

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
    expect((await send('driver', start(), 'hook', { ...env, DRIVER_BOT_TOKEN: undefined })).status).toBe(404);
    expect((await send('taxi', start())).status).toBe(404);
    expect((await send('passenger', start(), 'hook', {})).status).toBe(404);
  });

  it('opens the admin Mini App only for the team; for others the admin bot is support (docs/02)', async () => {
    const team = (await (await send('admin', start(7))).json()) as Reply;
    expect(team.reply_markup.inline_keyboard[0]?.[0]?.web_app.url).toBe(`https://admin.${brand.domain}`);
    const stranger = (await (await send('admin', start(9))).json()) as Reply;
    expect(stranger.text).toContain('yordam xizmati');
    expect(stranger.reply_markup).toBeUndefined();
  });

  it('offers "Haydovchi boʻlish" in the passenger bot: a link to the driver bot', async () => {
    const reply = (await (await send('passenger', start())).json()) as {
      reply_markup: { inline_keyboard: { text: string; url?: string }[][] };
    };
    expect(reply.reply_markup.inline_keyboard[1]?.[0]).toEqual({
      text: 'Haydovchi boʻlish',
      url: `https://t.me/${brand.bots.driver}?start=from_passenger`,
    });
  });

  it('tells a blocked person that the account is blocked, in every bot (docs/17)', async () => {
    await localUsers.save({
      id: 66,
      publicId: publicIdOf(66),
      firstName: 'Ali',
      gender: 'male',
      phone: '+998900000066',
      locale: 'uz-Latn',
      isDriver: false,
      consentAt: 1,
      block: { until: null },
      avatarKey: null,
      writeAccess: false,
      newsOff: false,
      createdAt: 1,
      updatedAt: 1,
    });
    for (const role of ['passenger', 'admin']) {
      expect(await (await send(role, start(66))).json()).toEqual({
        method: 'sendMessage',
        chat_id: 42,
        text: 'Hisobingiz bloklangan.',
      });
    }
  });

  it('sends the three documents on /hujjatlar, readable before the registration (docs/30)', async () => {
    for (const role of ['passenger', 'driver'] as const) {
      const reply = (await (await send(role, start(3, '/hujjatlar'))).json()) as Reply;
      const urls = reply.reply_markup.inline_keyboard.map((row) => row[0]?.web_app.url);
      expect(urls).toEqual(
        ['offer', 'privacy', 'consent'].map((doc) => `https://${role}.${brand.domain}/?doc=${doc}`),
      );
    }
    const admin = (await (await send('admin', start(9, '/hujjatlar'))).json()) as { text?: string };
    expect(admin.text).not.toContain('Ommaviy oferta');
  });

  it('answers other updates with an empty 200, so Telegram does not retry', async () => {
    expect(await (await send('passenger', start(1, 'salom'))).json()).toEqual({});
    expect(await (await send('passenger', { edited_message: {} })).json()).toEqual({});
    expect((await send('passenger', 'not an update')).status).toBe(200);
  });

  it('takes no location from people: the points come with the booking (docs/70)', async () => {
    const location = (replyTo?: number) => ({
      message: {
        message_id: 5,
        chat: { id: 42 },
        from: { id: 7 },
        location: { latitude: 41.3, longitude: 69.2 },
        ...(replyTo ? { reply_to_message: { message_id: replyTo } } : {}),
      },
    });
    expect(await (await send('driver', location(3))).json()).toEqual({});
    expect(await (await send('driver', start(7, 'salom'))).json()).toEqual({});
    expect(await (await send('passenger', location())).json()).toEqual({});
    expect(await (await send('passenger', location(3))).json()).toEqual({});
  });
});
