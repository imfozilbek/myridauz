import { appHost, loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../../env';
import { notify, notifyTeam } from '../../notifications';
import { peopleOf } from '../../users';
import type { ChatSignals } from '../application/ports';

const { t } = createI18n(DEFAULT_LOCALE);
// The Mini App opens this chat at once (docs/07).
export const CHAT_PARAM = 'chat';

// The passenger hears from the passenger bot, the driver from the driver bot (docs/07).
export const botSignals = (env: Bindings): ChatSignals => ({
  newMessage: async (to, key) => {
    const url = `https://${appHost(loadBrand(env.BRAND), to.role)}/?${CHAT_PARAM}=${key}`;
    const markup = { inline_keyboard: [[{ text: t('bot.chat.open'), web_app: { url } }]] };
    await notify(env, [{ bot: to.role, chatId: to.userId, text: t('bot.chat.newMessage'), markup }]);
  },
  contactAttempts: async (userId, key, count) => {
    const person = await peopleOf(env).find(userId);
    const name = person?.firstName ?? String(userId);
    await notifyTeam(
      env,
      t('bot.chat.contactAttempts', { name, id: String(userId), count: String(count), key }),
    );
  },
});
