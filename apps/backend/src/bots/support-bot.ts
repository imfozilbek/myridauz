import type { BrandConfig } from '@platform/brands';
import { hourLabel } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { assignTo } from '../modules/assignments';
import { forwardToTeam, recordSupport, supportDeps, supportTalk } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { isStartCommand, type BotMessage } from './telegram-update';
import { mediaOf } from './media';
import { welcomePicture } from './start-reply';
import { copyButtons } from './support-reply';
import { withLabel } from './support-talk';

const { t } = createI18n(DEFAULT_LOCALE);
export const SUPPORT_BOT = 'support';
// At most this many messages of one person a minute reach the team; the rest stay in the talk (G42).
export const SUPPORT_PER_MINUTE = 10;
const MINUTE_MS = 60 * 1000;

// The admin bot is only for the team: everyone else is sent to the support bot (docs/50).
export const toSupportBot = (brand: BrandConfig, chatId: number) =>
  sendMessage(chatId, t('bot.admin.denied', { brand: brand.name }), {
    inline_keyboard: [[{ text: t('bot.admin.toSupport'), url: `https://t.me/${brand.bots.support}` }]],
  });

// A question to the team (docs/50): a text, a photo or a voice message. The one assigned member gets
// a copy in the admin bot (docs/92) with the talk kept (G32); the writer hears «qabul qilindi».
async function toSupport(context: BotContext, message: BotMessage) {
  const chatId = message.chat.id;
  const media = await mediaOf(context, SUPPORT_BOT, message);
  const said = message.text ?? message.caption;
  if (said === undefined && !media) return sendMessage(chatId, t('bot.support.textOnly'));
  const kind = media?.kind ?? 'text';
  const name = message.from?.first_name ?? '';
  const text = t('bot.support.incoming', {
    name,
    id: String(message.from?.id ?? chatId),
    text: withLabel(kind, said),
  });
  const talk = await supportTalk(context.env, chatId);
  const wroteBefore = talk.length > 0;
  const now = Date.now();
  const lastMinute = talk.filter((line) => line.author === 'person' && now - line.at < MINUTE_MS).length;
  await recordSupport(context.env, {
    personId: chatId,
    at: now,
    author: 'person',
    name,
    kind,
    text: said ?? '',
  });
  if (lastMinute >= SUPPORT_PER_MINUTE) return {};
  const deps = {
    ...supportDeps(context.env, context.fetch),
    teamIds: () => assignTo(context.env, 'support', chatId),
  };
  await forwardToTeam(deps, { chatId, bot: SUPPORT_BOT }, { text, media, markup: copyButtons(wroteBefore) });
  return sendMessage(chatId, t('bot.support.received'));
}

// The welcome: a picture with the words and the team hours under it (owner approval 03.10.2026).
function supportWelcome(brand: BrandConfig, chatId: number) {
  const { from, to } = brand.moderation.hours;
  return {
    method: 'sendPhoto',
    chat_id: chatId,
    photo: welcomePicture(brand, 'support'),
    caption: t('bot.support.welcome', { brand: brand.name, from: hourLabel(from), to: hourLabel(to) }),
  };
}

// The support bot answers everyone, a blocked person too: support is where a block is asked about.
export function onSupportMessage(context: BotContext, message: BotMessage) {
  if (isStartCommand(message.text)) return supportWelcome(context.brand, message.chat.id);
  return toSupport(context, message);
}
