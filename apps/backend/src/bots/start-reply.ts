import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { BotRole } from './bot-roles';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);
// A driver who came from the passenger bot already knows Rida: another first line (G34).
const FROM_PASSENGER = 'from_passenger';
// The welcome pictures of the public bots, served by the landing (brand-kit/landing/bot.mjs).
export const welcomePicture = (brand: BrandConfig, role: 'passenger' | 'driver' | 'support') =>
  `https://${brand.domain}/bot/${role}-welcome.png`;

// A close person opens the passenger Mini App to follow a trip, no registration (docs/43).
const FOLLOW_PAYLOAD = /^follow_([A-Za-z0-9_-]{43})$/u;
const FOLLOW_PARAM = 'follow';

const miniAppUrl = (brand: BrandConfig, role: BotRole) => `https://${appHost(brand, role)}`;
export const openButton = (brand: BrandConfig, role: BotRole) => ({
  text: t('bot.open'),
  web_app: { url: miniAppUrl(brand, role) },
});

// The menu button next to the input field: its own name, chosen by the owner (03.10.2026).
export const menuButton = (brand: BrandConfig, role: BotRole) => ({
  type: 'web_app',
  text: t('bot.menu'),
  web_app: { url: miniAppUrl(brand, role) },
});

// "Haydovchi boʻlish" in the passenger bot opens the driver bot (docs/02).
const becomeDriver = (brand: BrandConfig) => ({
  text: t('bot.passenger.becomeDriver'),
  url: `https://t.me/${brand.bots.driver}?start=${FROM_PASSENGER}`,
});

// The public bots greet with a picture: what Rida gives this person (G34, docs/95; passenger 03.10.2026).
function welcome(brand: BrandConfig, role: 'passenger' | 'driver', chatId: number, payload: string) {
  const hello =
    role === 'driver' && payload === FROM_PASSENGER ? 'bot.driver.helloFromPassenger' : 'bot.hello';
  const about =
    role === 'driver'
      ? t('bot.driver.welcome', { bonus: formatMoney(brand.promo.amount) })
      : t('bot.passenger.welcome');
  const rows = [[openButton(brand, role)], ...(role === 'passenger' ? [[becomeDriver(brand)]] : [])];
  return {
    method: 'sendPhoto',
    chat_id: chatId,
    photo: welcomePicture(brand, role),
    caption: [t(hello, { brand: brand.name }), about].join('\n\n'),
    reply_markup: { inline_keyboard: rows },
  };
}

type StartContext = {
  readonly brand: BrandConfig;
  readonly role: BotRole;
  readonly chatId: number;
  // "/start follow_<token>" from the card of a shared trip (docs/43).
  readonly payload?: string;
  readonly access: 'allowed' | 'blocked';
};

// The answer to /start goes back in the webhook response: no extra request to Telegram (docs/03).
export function startReply({ brand, role, chatId, access, payload = '' }: StartContext) {
  if (access === 'blocked') return { method: 'sendMessage', chat_id: chatId, text: t('bot.blocked') };
  const follow = FOLLOW_PAYLOAD.exec(payload);
  if (role === 'passenger' && follow) {
    const url = `${miniAppUrl(brand, role)}/?${FOLLOW_PARAM}=${follow[1]}`;
    const button = { text: t('bot.share.follow'), web_app: { url } };
    return {
      method: 'sendMessage',
      chat_id: chatId,
      text: t('bot.share.open'),
      reply_markup: { inline_keyboard: [[button]] },
    };
  }
  if (role !== 'admin') return welcome(brand, role, chatId, payload);
  return {
    method: 'sendMessage',
    chat_id: chatId,
    text: t('bot.admin.start', { brand: brand.name }),
    reply_markup: { inline_keyboard: [[openButton(brand, role)]] },
  };
}
