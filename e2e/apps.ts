import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t } = createI18n(DEFAULT_LOCALE);

// Each Mini App is built and served on its own port during e2e runs.
export const MINI_APPS = [
  {
    name: 'passenger',
    port: 4101,
    welcome: () => t('common.passenger.welcome'),
    action: t('common.passenger.findTrip'),
  },
  {
    name: 'driver',
    port: 4102,
    welcome: () => t('common.driver.welcome'),
    action: t('common.driver.newTrip'),
  },
  {
    name: 'admin',
    port: 4103,
    welcome: (brand: string) => t('common.admin.welcome', { brand }),
    action: t('common.admin.applications'),
  },
] as const;

export const CONTINUE = t('common.continue');
export const appUrl = (port: number) => `http://localhost:${port}/`;
