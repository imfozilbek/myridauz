import type { BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { assignTo } from '../modules/assignments';
import { forwardToTeam, recordSupport, supportDeps, supportTalk } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { isStartCommand, type BotMessage } from './telegram-update';
import { mediaOf } from './media';
import { copyButtons } from './support-reply';
import { withLabel } from './support-talk';

const { t } = createI18n(DEFAULT_LOCALE);
export const SUPPORT_BOT = 'support';

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
  const wroteBefore = (await supportTalk(context.env, chatId)).length > 0;
  await recordSupport(context.env, {
    personId: chatId,
    at: Date.now(),
    author: 'person',
    name,
    kind,
    text: said ?? '',
  });
  const deps = {
    ...supportDeps(context.env, context.fetch),
    teamIds: () => assignTo(context.env, 'support', chatId),
  };
  await forwardToTeam(deps, { chatId, bot: SUPPORT_BOT }, { text, media, markup: copyButtons(wroteBefore) });
  return sendMessage(chatId, t('bot.support.received'));
}

// The support bot answers everyone, a blocked person too: support is where a block is asked about.
export function onSupportMessage(context: BotContext, message: BotMessage) {
  if (isStartCommand(message.text))
    return sendMessage(message.chat.id, t('bot.support.welcome', { brand: context.brand.name }));
  return toSupport(context, message);
}
