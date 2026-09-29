import { appHost, type BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Alert } from '../domain/alerts';

const { t } = createI18n(DEFAULT_LOCALE);

// A signal to the admin bot with a button to the dashboard (docs/29).
export function alertMessage(brand: BrandConfig, alert: Alert) {
  const url = `https://${appHost(brand, 'admin')}/?stats=day`;
  const markup = { inline_keyboard: [[{ text: t('stats.open'), web_app: { url } }]] };
  const text =
    alert.kind === 'errors'
      ? t('bot.stats.errors', { hour: alert.hour, usual: alert.usual })
      : t('bot.stats.drop', {
          funnel: t(`stats.funnel.${alert.funnel}`),
          step: t(`stats.step.${alert.step}`),
          drop: alert.drop,
          usual: alert.usual,
        });
  return { text, markup };
}
