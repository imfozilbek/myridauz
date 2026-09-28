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

// "Haydovchi boʻlish" in the passenger bot opens the driver bot (docs/02).
const becomeDriver = (brand: BrandConfig) => ({
  text: t('bot.passenger.becomeDriver'),
  url: `https://t.me/${brand.bots.driver}?start=from_passenger`,
});

type StartContext = {
  readonly brand: BrandConfig;
  readonly role: BotRole;
  readonly chatId: number;
  // support: a person outside the team writes to the admin bot, it is the support contact (docs/02).
  readonly access: 'allowed' | 'support' | 'blocked';
};

// The answer to /start goes back in the webhook response: no extra request to Telegram (docs/03).
export function startReply({ brand, role, chatId, access }: StartContext) {
  if (access === 'blocked') return { method: 'sendMessage', chat_id: chatId, text: t('bot.blocked') };
  if (access === 'support') {
    return { method: 'sendMessage', chat_id: chatId, text: t('bot.support.welcome', { brand: brand.name }) };
  }
  const rows = [[openButton(brand, role)], ...(role === 'passenger' ? [[becomeDriver(brand)]] : [])];
  return {
    method: 'sendMessage',
    chat_id: chatId,
    text: t(START_TEXT[role], { brand: brand.name }),
    reply_markup: { inline_keyboard: rows },
  };
}
