import { loadBrand } from '@platform/brands';
import { helpQuestions, helpTopicsFor, helpValues, type HelpQuestion } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test, type Page } from './crash-guard';
import { openMockupWallet } from './g65-wallet-mock';
import { openDriverShot } from './g76-driver-mock';
import { openPassengerShot } from './g76-passenger-mock';
import { showChat } from './stand/bot-chat';
import type { BotMessage } from './stand/stand-tools';

// The mockup of G97 (docs/226): «Yordam» of the Mini Apps and the help of the bots, from the real
// screens at the size of the phones of the mockups (360 × 760 at 2). The shots are the mockup and its
// Pixel Perfect.
const { t, formatMoney } = createI18n(DEFAULT_LOCALE);
const values = helpValues(loadBrand(), formatMoney);
const OUT = 'screenshots/pixel-g97';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 2 });

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });
}

const openHelp = async (page: Page) => {
  await page.getByText(t('home.support'), { exact: true }).click();
  await expect(page.getByText(t('help.lead'))).toBeVisible();
};

test('1 … 3: a passenger opens «Yordam», a topic and an answer', async ({ page }) => {
  await openPassengerShot(page, 2);
  await openHelp(page);
  await shot(page, '1-topics');
  await page.getByText(t('help.topic.booking'), { exact: true }).click();
  await shot(page, '2-topic');
  await page.getByText(t('help.booking.wait.q', values)).click();
  await expect(page.getByText(t('help.more'))).toBeVisible();
  await shot(page, '3-answer');
});

test('4: a driver sees the topics of a driver first', async ({ page }) => {
  await openDriverShot(page, 2);
  await openHelp(page);
  await shot(page, '4-driver-topics');
});

test('5: «Hamyon» ends with the questions of its topic', async ({ page }) => {
  await openMockupWallet(page);
  const link = page.getByText(t('help.link', { topic: t('help.topic.wallet') }));
  await link.scrollIntoViewIfNeeded();
  await shot(page, '5-wallet');
});

// The bot draws its buttons as Telegram does: the topics two in a row, the questions one in a row.
const message = (text: string, rows: string[][]): BotMessage => ({
  bot: 'passenger',
  method: 'sendMessage',
  chatId: 1,
  chat: '1',
  text,
  buttons: [],
  rows,
  messageId: 1,
  target: null,
  replyTo: null,
});
const topics = helpTopicsFor('passenger').map((topic) => t(`help.bot.topic.${topic}`));
const pairs = [0, 2, 4].map((start) => topics.slice(start, start + 2));
const more = t('help.bot.more');
const back = t('help.bot.back');

// The chat is a page of its own without a viewport tag: drawn as a desktop page, at the width of a phone.
test.describe('the bot', () => {
  test.use({ isMobile: false, hasTouch: false });
  test('6, 7: «/yordam» in the bot of a passenger, then an answer in the same message', async ({ page }) => {
    await showChat(page, 'passenger', [message(t('help.bot.topics'), [...pairs, [more]])]);
    await page.screenshot({ path: `${OUT}/6-bot-topics-code.png`, fullPage: true });
    const question: HelpQuestion = 'booking.wait';
    const answer = `<b>${t(`help.${question}.q`, values)}</b>\n\n${t(`help.${question}.a`, values)}`;
    await showChat(page, 'passenger', [message(answer, [[back, more]])]);
    await page.screenshot({ path: `${OUT}/7-bot-answer-code.png`, fullPage: true });
    expect(helpQuestions('booking')).toContain(question);
  });
});
