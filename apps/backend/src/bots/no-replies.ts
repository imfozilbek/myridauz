import type { BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { sendMessage } from './bot-context';
import { openButton } from './start-reply';

const { t } = createI18n(DEFAULT_LOCALE);

// Any other text to the passenger or the driver bot: nobody is left without an answer (G34).
// The bot does not read messages, so it shows the way to the app and to the support bot.
export function noRepliesReply(brand: BrandConfig, role: 'passenger' | 'driver', chatId: number) {
  const help = { text: t('bot.help'), url: `https://t.me/${brand.bots.support}` };
  return sendMessage(chatId, t('bot.noReplies', { supportBot: brand.bots.support }), {
    inline_keyboard: [[openButton(brand, role), help]],
  });
}
