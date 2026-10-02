import type { BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { forwardToTeam, supportDeps } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { isStartCommand, type BotMessage } from './telegram-update';
import { voiceOf } from './voice';

const { t } = createI18n(DEFAULT_LOCALE);
export const SUPPORT_BOT = 'support';

// The admin bot is only for the team: everyone else is sent to the support bot (docs/50).
export const toSupportBot = (brand: BrandConfig, chatId: number) =>
  sendMessage(chatId, t('bot.admin.denied', { brand: brand.name }), {
    inline_keyboard: [[{ text: t('bot.admin.toSupport'), url: `https://t.me/${brand.bots.support}` }]],
  });

// A question to the team (docs/50): a text or a voice message. Every team member gets a copy in
// the admin bot; the writer hears «qabul qilindi» from the support bot.
async function toSupport(context: BotContext, message: BotMessage) {
  const chatId = message.chat.id;
  const voice = await voiceOf(context, SUPPORT_BOT, message);
  if (!message.text && !voice) return sendMessage(chatId, t('bot.support.textOnly'));
  const text = t('bot.support.incoming', {
    name: message.from?.first_name ?? '',
    id: String(message.from?.id ?? chatId),
    text: message.text ?? t('bot.support.voice'),
  });
  await forwardToTeam(supportDeps(context.env, context.fetch), { chatId, bot: SUPPORT_BOT }, { text, voice });
  return sendMessage(chatId, t('bot.support.received'));
}

// The support bot answers everyone, a blocked person too: support is where a block is asked about.
export function onSupportMessage(context: BotContext, message: BotMessage) {
  if (isStartCommand(message.text))
    return sendMessage(message.chat.id, t('bot.support.welcome', { brand: context.brand.name }));
  return toSupport(context, message);
}
