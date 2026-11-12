import { loadBrand } from '@platform/brands';
import { helpValues } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Browser } from '@playwright/test';
import { expect, test } from '../crash-guard';
import { showChat } from './bot-chat';
import { buttons, press, say, type Reply } from './bot-kit';
import { shootIn } from './g63-kit';
import { register } from './seed';
import { NARROW } from './screen-tour';
import { openAs, outsideCalls, type Person } from './stand-kit';
import { botMessages, clearBotMessages, type BotMessage } from './stand-tools';

// G97 (docs/226), by role (docs/230, docs/231), on the whole local Rida: the help of the bots, one message that changes in place, and
// «Yordam» of the Mini App. People of this goal only (lessons 95, 378).
test.use({ viewport: NARROW });
test.describe.configure({ mode: 'serial' });
test.afterEach(() => expect(outsideCalls()).toEqual([]));

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);
const values = helpValues(loadBrand(), formatMoney);
const LOLA: Person = { id: 900991, name: 'Lola', phone: '998901110991' };
const JAMSHID: Person = { id: 900992, name: 'Jamshid', phone: '998901110992' };
const shoot = shootIn('g97');
const edits = async (person: Person) =>
  (await botMessages()).filter((one) => one.chatId === person.id && one.method.startsWith('editMessage'));

// The chat of the passenger with the bot as Telegram shows it, for the mockup g97/6 and g97/7 and
// their Pixel Perfect (docs/226): the topics come in the answer to «/yordam», the taps edit them.
// The chat is drawn with the pictures of the brand kit, which only the stand has (lesson 388).
const TOPICS = 7;
const sent = (reply: Reply): BotMessage => ({
  bot: 'passenger',
  method: 'sendMessage',
  chatId: LOLA.id,
  chat: String(LOLA.id),
  text: reply.text ?? '',
  buttons: [],
  rows: (reply.reply_markup?.inline_keyboard ?? []).map((row) => row.map((key) => key.text)),
  messageId: TOPICS,
  target: null,
  replyTo: null,
});
// The chat is a page without a viewport tag: drawn as a desktop page at the width of a phone, not as
// the phone of the stand (a new page takes its settings).
async function chat(browser: Browser, name: string, messages: readonly BotMessage[]) {
  const phone = { viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 };
  const page = await browser.newPage({ ...phone, isMobile: false, hasTouch: false });
  await showChat(page, 'passenger', messages);
  await page.screenshot({ path: `screenshots/pixel-g97/${name}-code.png`, fullPage: true });
  await page.close();
}

test('H1. «/yordam» in the bot of a passenger: a topic and an answer change the same message', async ({
  browser,
}) => {
  await clearBotMessages();
  const topics = await say('passenger', LOLA, '/yordam');
  expect(topics.text).toBe(t('help.bot.topics'));
  expect(buttons(topics)[0]).toBe(t('help.bot.topic.basics', values));
  expect(buttons(topics).at(-1)).toBe(t('help.bot.more'));
  await chat(browser, '6-bot-topics', [sent(topics)]);
  await press('passenger', LOLA, 'help:t:booking:passenger', TOPICS);
  await press('passenger', LOLA, 'help:q:booking.wait:passenger', TOPICS);
  const [topic, answer] = await edits(LOLA);
  expect(topic).toMatchObject({ method: 'editMessageText', target: TOPICS });
  expect(topic?.text).toBe(t('help.bot.questions', { topic: t('help.topic.booking') }));
  expect(answer?.text).toContain(t('help.booking.wait.a', values));
  expect(answer?.rows).toEqual([[t('help.bot.back'), t('help.bot.more')]]);
  await chat(browser, '7-bot-answer', [sent(topics), ...(await edits(LOLA))]);
});

test('H2. the driver sees only the topics of a driver; the main bot has the help too', async () => {
  expect(buttons(await say('driver', JAMSHID, '/yordam')).slice(0, 2)).toEqual([
    t('help.bot.topic.application'),
    t('help.bot.topic.publish'),
  ]);
  expect((await say('main', JAMSHID, '/yordam')).text).toBe(t('help.bot.topics'));
});

test('H3. the support bot: the topics under its welcome, «Boshqa savolim bor» asks for the question', async () => {
  await clearBotMessages();
  const welcome = await say('support', LOLA, '/start');
  expect(welcome.caption).toContain(t('help.more'));
  expect(buttons(welcome).at(-1)).toBe(t('help.bot.more'));
  await press('support', LOLA, 'help:q:account.delete:passenger', 9);
  const [answer] = await edits(LOLA);
  expect(answer).toMatchObject({ method: 'editMessageCaption', target: 9 });
  expect(answer?.text).toContain(t('help.account.delete.q'));
  expect((await press('support', LOLA, 'help:more', 9)).text).toBe(t('bot.support.ask'));
});

test('H4. «Yordam» of the Mini App: a topic, an answer with the numbers of the brand', async ({ page }) => {
  await register('passenger', LOLA, 'female');
  await openAs(page, 'passenger', LOLA);
  await page.getByText(t('home.support'), { exact: true }).click();
  await expect(page.getByText(t('help.lead'))).toBeVisible();
  await shoot(page, { platform: 'android' }, '1-topics');
  await page.getByText(t('help.topic.booking'), { exact: true }).click();
  await page.getByText(t('help.booking.wait.q')).click();
  await expect(page.getByText(t('help.booking.wait.a', values))).toBeVisible();
  await shoot(page, { platform: 'android' }, '2-answer');
});
