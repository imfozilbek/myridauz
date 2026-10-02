import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { describe, expect, it } from 'vitest';
import { localUsers } from '../modules/users';
import { botEnv, botSender, fakeTelegram } from './test-bot';
import { publicIdOf } from '../test-people';

const brand = loadBrand();
const { formatMoney } = createI18n(DEFAULT_LOCALE);
type Reply = { text: string; reply_markup: { inline_keyboard: { web_app: { url: string } }[][] } };
type LinkReply = { text: string; reply_markup: { inline_keyboard: { url: string }[][] } };
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

  it('opens the admin Mini App only for the team; others are sent to the support bot (docs/50)', async () => {
    const team = (await (await send('admin', start(7))).json()) as Reply;
    expect(team.reply_markup.inline_keyboard[0]?.[0]?.web_app.url).toBe(`https://admin.${brand.domain}`);
    const stranger = (await (await send('admin', start(9))).json()) as LinkReply;
    expect(stranger.text).toContain('yordam xizmatiga yozing');
    expect(stranger.reply_markup.inline_keyboard[0]?.[0]?.url).toBe(`https://t.me/${brand.bots.support}`);
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

  it('greets a driver with the picture, what the brand gives and the bonus of the brand (G34)', async () => {
    const reply = (await (await send('driver', start())).json()) as Reply & {
      photo: string;
      caption: string;
    };
    expect(reply).toMatchObject({ method: 'sendPhoto', chat_id: 42 });
    expect(reply.photo).toBe(`https://${brand.domain}/bot/driver-welcome.png`);
    expect(reply.caption.startsWith(`Assalomu alaykum! ${brand.name}: `)).toBe(true);
    expect(reply.caption).toContain(`Boshlash uchun ${formatMoney(brand.promo.amount)} bonus.`);
    expect(reply.reply_markup.inline_keyboard).toEqual([
      [{ text: 'Ochish', web_app: { url: `https://driver.${brand.domain}` } }],
    ]);
    const fromPassenger = (await (await send('driver', start(1, '/start from_passenger'))).json()) as {
      caption: string;
    };
    expect(fromPassenger.caption).toMatch(/^Assalomu alaykum! Endi .+ bilan haydovchi sifatida/u);
    expect(fromPassenger.caption).not.toContain('Bu taksi emas');
    expect(fromPassenger.caption).toContain('Haydovchi sifatida siz:');
  });

  it('answers any other text with the way to the app and to support, in both public bots (G34)', async () => {
    for (const role of ['passenger', 'driver'] as const) {
      const reply = (await (await send(role, start(1, 'salom'))).json()) as Reply;
      expect(reply.text).toContain(`@${brand.bots.support} ga yozing`);
      expect(reply.reply_markup.inline_keyboard).toEqual([
        [
          { text: 'Ochish', web_app: { url: `https://${role}.${brand.domain}` } },
          { text: 'Yordam', url: `https://t.me/${brand.bots.support}` },
        ],
      ]);
    }
  });

  it('answers other updates with an empty 200, so Telegram does not retry', async () => {
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
    expect(await (await send('passenger', location())).json()).toEqual({});
    expect(await (await send('passenger', location(3))).json()).toEqual({});
  });
});
