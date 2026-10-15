import type { BrandConfig } from '@platform/brands';
import { botStartLink } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { isBlocked } from '../modules/users';
import { mainStarted } from '../modules/waitlist';
import { bold, escapeHtml, quote } from '../shared/telegram/html';
import { appButton } from '../shared/telegram/open-button';
import type { BotContext } from './bot-context';
import { DOCUMENTS_COMMAND, documentsReply } from './documents-reply';
import { noRepliesReply } from './no-replies';
import { welcomePicture } from './start-reply';
import { isStartCommand, type BotMessage, type TelegramUpdate } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
// The mark of the links from the main bot to the bots of the trips (docs/116).
const VIA_MAIN = 'main';

// The welcome of the main bot (G83, docs/181, docs/182): a picture, the three short questions of the
// pains, «🚀 Roʻyxatga yozilish» into the questionnaire and «📣 Kanal». Closed by the owner: the trips.
function mainWelcome(brand: BrandConfig, chatId: number, name: string, open: boolean) {
  const hello = t('bot.main.hello', { name: escapeHtml(name) });
  const about = (key: 'bot.main.about' | 'bot.main.openedAbout') =>
    t(key, { brand: bold(escapeHtml(brand.name)) });
  const channel = { text: t('bot.main.channel'), url: `https://t.me/${brand.mainChannel}` };
  const trips = (bot: string, text: string) => ({
    text,
    url: botStartLink(bot, VIA_MAIN),
  });
  const caption = open
    ? [
        hello,
        about('bot.main.about'),
        t('bot.main.asks'),
        t('bot.main.solves', { brand: escapeHtml(brand.name) }),
        quote([t('bot.main.write')]),
      ]
    : [hello, about('bot.main.openedAbout'), t('bot.main.findTrip'), t('bot.main.offerTrip')];
  const rows = open
    ? [[appButton(brand, 'main', t('bot.main.join'))], [channel]]
    : [
        [trips(brand.bots.passenger, t('bot.main.find')), trips(brand.bots.driver, t('bot.main.publish'))],
        [channel],
      ];
  return {
    method: 'sendPhoto',
    chat_id: chatId,
    photo: welcomePicture(brand, open ? 'main' : 'main-open'),
    caption: caption.join('\n'),
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: rows },
  };
}

async function onMessage(bot: BotContext, message: BotMessage) {
  const chatId = message.chat.id;
  const fromId = message.from?.id ?? 0;
  if (await isBlocked(bot.env, fromId)) {
    return isStartCommand(message.text)
      ? { method: 'sendMessage', chat_id: chatId, text: t('bot.blocked') }
      : {};
  }
  if (isStartCommand(message.text)) {
    const open = await mainStarted(bot.env, fromId, message.text?.split(' ')[1] ?? '');
    return mainWelcome(bot.brand, chatId, message.from?.first_name ?? '', open);
  }
  if (message.text === DOCUMENTS_COMMAND) return documentsReply(bot.brand, 'main', chatId);
  return message.text ? noRepliesReply(bot.brand, 'main', chatId) : {};
}

// The main bot reads only messages: its buttons open the questionnaire or a link (docs/181).
export const onMainUpdate = (bot: BotContext, data: TelegramUpdate) =>
  data.message ? onMessage(bot, data.message) : {};
