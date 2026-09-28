import { t } from '@platform/i18n';

// Each Mini App is built and served on its own port during e2e runs.
export const MINI_APPS = [
  { name: 'passenger', port: 4101, text: () => t('start.passenger') },
  { name: 'driver', port: 4102, text: () => t('start.driver') },
  { name: 'admin', port: 4103, text: (brand: string) => t('start.admin', { brand }) },
] as const;

export const appUrl = (port: number) => `http://localhost:${port}/`;
