import { loadBrand } from '@platform/brands';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { testD1 } from '../test-d1';
import { botEnv, botSender, fakeTelegram, textMessage } from './test-bot';

const telegram = fakeTelegram();
vi.stubGlobal('fetch', telegram.fetch);
afterAll(() => vi.unstubAllGlobals());
const send = botSender(telegram.fetch);
const brand = loadBrand();
const db = testD1();
const env = { ...botEnv, DB: db };
type Welcome = {
  method: string;
  caption: string;
  photo: string;
  reply_markup: { inline_keyboard: { text: string; url?: string; web_app?: { url: string } }[][] };
};
const welcome = async (fromId: number, text: string) =>
  (await (await send('main', textMessage(fromId, text), 'hook', env)).json()) as Welcome;

describe('the main bot of the waitlist (G83, docs/181)', () => {
  it('greets with the picture, the three questions and «Roʻyxatga yozilish»', async () => {
    const answer = await welcome(41, '/start ad-k7f2qx');
    expect(answer.method).toBe('sendPhoto');
    expect(answer.photo).toBe(`https://${brand.domain}/bot/main-welcome.png?v=${brand.welcomes.main}`);
    expect(answer.caption).toContain('Assalomu alaykum, Ali! 👋');
    expect(answer.caption).toContain('🔎 Guruhlardan kerakli eʼlonni topish qiyinmi?');
    expect(answer.reply_markup.inline_keyboard[0]?.[0]?.web_app?.url).toBe(
      `https://main.${brand.domain}/?via=bot-home`,
    );
    expect(answer.reply_markup.inline_keyboard[1]?.[0]?.url).toBe(`https://t.me/${brand.mainChannel}`);
  });

  it('keeps the mark of the first Start only: the source of the person (docs/116)', async () => {
    await welcome(42, '/start fr-abcdefgh');
    await welcome(42, '/start ad-zzzzzz');
    const visit = await db
      .prepare('SELECT via, started_at FROM waitlist_visits WHERE telegram_id = 42')
      .first<{
        via: string;
      }>();
    expect(visit?.via).toBe('fr-abcdefgh');
    await welcome(43, '/start');
    expect(
      (await db.prepare('SELECT via FROM waitlist_visits WHERE telegram_id = 43').first<{ via: null }>())
        ?.via,
    ).toBeNull();
  });

  it('closed by the owner: the trip buttons instead of the questionnaire', async () => {
    await db
      .prepare("INSERT INTO switches (key, value, changed_by, changed_at) VALUES ('waitlist', 0, 7, 1)")
      .run();
    const answer = await welcome(44, '/start');
    expect(answer.caption).toContain('ochildi');
    expect(answer.photo).toBe(
      `https://${brand.domain}/bot/main-open-welcome.png?v=${brand.welcomes['main-open']}`,
    );
    const urls = answer.reply_markup.inline_keyboard.flat().map((button) => button.url ?? '');
    expect(urls).toContain(`https://t.me/${brand.bots.passenger}?startapp=__main`);
    expect(urls).toContain(`https://t.me/${brand.bots.driver}?startapp=__main`);
    await db.prepare("DELETE FROM switches WHERE key = 'waitlist'").run();
  });

  it('answers the documents and any other text; a blocked person gets only the block', async () => {
    const documents = (await (
      await send('main', textMessage(45, '/hujjatlar'), 'hook', env)
    ).json()) as Welcome;
    expect(JSON.stringify(documents)).toContain(`https://main.${brand.domain}/?doc=`);
    const other = (await (await send('main', textMessage(45, 'Salom'), 'hook', env)).json()) as {
      text: string;
    };
    expect(other.text).toContain('xabarlarga javob bermaydi');
    const tap = { callback_query: { id: 'q', from: { id: 45 }, data: 'x' } };
    expect(await (await send('main', tap, 'hook', env)).json()).toEqual({});
  });
});
