import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Alert } from '../domain/alerts';

const { t } = createI18n(DEFAULT_LOCALE);

// A sign of the dashboard for «Diqqat» of the owner (docs/29, G68): errors ring, a drop does not.
export function alertSign(alert: Alert) {
  if (alert.kind === 'errors')
    return {
      id: 'errors',
      text: t('bot.stats.errors', { hour: alert.hour, usual: alert.usual }),
      ring: true,
      sign: { kind: 'errors' as const, hour: alert.hour, usual: alert.usual },
    };
  const text = t('bot.stats.drop', {
    funnel: t(`stats.funnel.${alert.funnel}`),
    step: t(`stats.step.${alert.step}`),
    drop: alert.drop,
    usual: alert.usual,
  });
  const { funnel, step, drop, usual } = alert;
  return {
    id: `drop:${funnel}:${step}`,
    text,
    ring: false,
    sign: { kind: 'drop' as const, funnel, step, drop, usual },
  };
}
