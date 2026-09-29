import { appHost, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { notify, notifyTeam } from '../../notifications';
import { peopleOf } from '../../users';
import type { ChatSignals, Role } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);
// The Mini App opens this chat at once (docs/07).
const CHAT_PARAM = 'chat';

// The passenger hears from the passenger bot, the driver from the driver bot (docs/07).
type To = { readonly userId: number; readonly role: Role };
// A message of the bot of this person with one button that opens the chat.
const toChat = async (env: Bindings, to: To, key: string, text: string, button: string) => {
  const url = `https://${appHost(loadBrand(env.BRAND), to.role)}/?${CHAT_PARAM}=${key}`;
  const markup = { inline_keyboard: [[{ text: button, web_app: { url } }]] };
  await notify(env, [{ bot: to.role, chatId: to.userId, text, markup }]);
};

export const botSignals = (env: Bindings): ChatSignals => ({
  newMessage: (to, key) => toChat(env, to, key, t('bot.chat.newMessage'), t('bot.chat.open')),
  // A call cannot ring a closed Mini App: the bot calls the person in (docs/08).
  incomingCall: (to, key) => toChat(env, to, key, t('bot.call.incoming'), t('bot.call.answer')),
  missedCall: (to, key) => toChat(env, to, key, t('bot.call.missed'), t('bot.chat.open')),
  contactAttempts: async (userId, key, count) => {
    const person = await peopleOf(env).find(userId);
    const name = person?.firstName ?? String(userId);
    await notifyTeam(
      env,
      t('bot.chat.contactAttempts', { name, id: String(userId), count: String(count), key }),
    );
  },
});
