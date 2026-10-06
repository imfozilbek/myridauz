import { appHost, type BrandChannel, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { NotificationJob } from '../../notifications';

const { t } = createI18n(DEFAULT_LOCALE);

// «Kanalga oʻtish» opens the channel; a channel link carries no mark of its source, the links in its
// posts do (docs/116). «Safar topish» opens the passenger Mini App (docs/119).
export const zoneMessage =
  (brand: BrandConfig) =>
  (userId: number, zone: BrandChannel): NotificationJob => ({
    bot: 'passenger',
    chatId: userId,
    text: t('bot.zone.invite', { zone: zone.title }),
    markup: {
      inline_keyboard: [
        [{ text: t('bot.zone.join'), url: `https://t.me/${zone.username}` }],
        [{ text: t('bot.zone.find'), web_app: { url: `https://${appHost(brand, 'passenger')}/` } }],
      ],
    },
  });
