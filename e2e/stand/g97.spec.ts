import { loadBrand } from '@platform/brands';
import { helpValues } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from '../crash-guard';
import { buttons, press, say } from './bot-kit';
import { shootIn } from './g63-kit';
import { register } from './seed';
import { NARROW } from './screen-tour';
import { openAs, outsideCalls, type Person } from './stand-kit';
import { botMessages, clearBotMessages } from './stand-tools';

// G97 (docs/226) on the whole local Rida: the help of the bots, one message that changes in place, and
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

test('H1. «/yordam» in the bot of a passenger: a topic and an answer change the same message', async () => {
  await clearBotMessages();
  const topics = await say('passenger', LOLA, '/yordam');
  expect(topics.text).toBe(t('help.bot.topics'));
  expect(buttons(topics)[0]).toBe(t('help.bot.topic.find'));
  expect(buttons(topics).at(-1)).toBe(t('help.bot.more'));
  await press('passenger', LOLA, 'help:t:booking', 7);
  await press('passenger', LOLA, 'help:q:booking.wait', 7);
  const [topic, answer] = await edits(LOLA);
  expect(topic).toMatchObject({ method: 'editMessageText', target: 7 });
  expect(topic?.text).toBe(t('help.bot.questions', { topic: t('help.topic.booking') }));
  expect(answer?.text).toContain(t('help.booking.wait.a', values));
  expect(answer?.rows).toEqual([[t('help.bot.back'), t('help.bot.more')]]);
});

test('H2. the driver sees the topics of a driver first; the main bot has the help too', async () => {
  expect(buttons(await say('driver', JAMSHID, '/yordam')).slice(0, 2)).toEqual([
    t('help.bot.topic.driver'),
    t('help.bot.topic.wallet'),
  ]);
  expect((await say('main', JAMSHID, '/yordam')).text).toBe(t('help.bot.topics'));
});

test('H3. the support bot: the topics under its welcome, «Boshqa savolim bor» asks for the question', async () => {
  await clearBotMessages();
  const welcome = await say('support', LOLA, '/start');
  expect(welcome.caption).toContain(t('help.more'));
  expect(buttons(welcome).at(-1)).toBe(t('help.bot.more'));
  await press('support', LOLA, 'help:q:account.delete', 9);
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
  await page.getByText(t('help.topic.wallet'), { exact: true }).click();
  await page.getByText(t('help.wallet.fee.q')).click();
  await expect(page.getByText(t('help.wallet.fee.a', values))).toBeVisible();
  await shoot(page, { platform: 'android' }, '2-answer');
});
