import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { BotRole } from './bot-roles';

const { t } = createI18n(DEFAULT_LOCALE);
const START_TEXT = {
  passenger: 'bot.passenger.start',
  driver: 'bot.driver.start',
  admin: 'bot.admin.start',
} as const;

const miniAppUrl = (brand: BrandConfig, role: BotRole) => `https://${appHost(brand, role)}`;
export const openButton = (brand: BrandConfig, role: BotRole) => ({
  text: t('bot.open'),
  web_app: { url: miniAppUrl(brand, role) },
});

type StartContext = {
  readonly brand: BrandConfig;
  readonly role: BotRole;
  readonly chatId: number;
  // not_admin: the admin bot answers only the team (docs/02); blocked: docs/17.
  readonly access: 'allowed' | 'not_admin' | 'blocked';
};

// The answer to /start goes back in the webhook response: no extra request to Telegram (docs/03).
export function startReply({ brand, role, chatId, access }: StartContext) {
  if (access === 'blocked') return { method: 'sendMessage', chat_id: chatId, text: t('bot.blocked') };
  if (access === 'not_admin')
    return { method: 'sendMessage', chat_id: chatId, text: t('bot.admin.denied', { brand: brand.name }) };
  return {
    method: 'sendMessage',
    chat_id: chatId,
    text: t(START_TEXT[role], { brand: brand.name }),
    reply_markup: { inline_keyboard: [[openButton(brand, role)]] },
  };
}
