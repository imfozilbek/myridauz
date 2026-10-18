import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { teamRole } from '../modules/team';
import { personByPublicId } from '../modules/users';
import { botToken } from '../shared/telegram/bot-config';
import { profileOf } from '../shared/telegram/profile-link';
import { sendText } from '../shared/telegram/telegram-api';
import type { BotContext } from './bot-context';
import type { BotRole } from './bot-roles';

const { t } = createI18n(DEFAULT_LOCALE);

// "/start profile_<id>" from a check of the team (owner, 18.10.2026): the bot the person knows gives
// the button to their Telegram profile, also without a public name. Telegram refuses the button when
// the person hid the profile in its settings: then the team hears it. Anyone else: the usual /start.
export async function profileReply(bot: BotContext, role: BotRole, chatId: number, payload: string) {
  const publicId = profileOf(payload);
  const token = botToken(bot.env, role);
  if (publicId === null || !token || (await teamRole(bot.env, chatId)) === null) return null;
  const person = await personByPublicId(bot.env, publicId);
  if (!person) {
    await sendText(bot.fetch, token, chatId, t('bot.person.gone'));
    return {};
  }
  const name = person.firstName;
  const button = { text: t('bot.person.open'), url: `tg://user?id=${person.id}` };
  await sendText(bot.fetch, token, chatId, t('bot.person.text', { name }), {
    inline_keyboard: [[button]],
  }).catch(() => sendText(bot.fetch, token, chatId, t('bot.person.closed', { name })));
  return {};
}
