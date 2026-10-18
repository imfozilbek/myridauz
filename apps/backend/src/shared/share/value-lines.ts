import type { BrandConfig } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';

const { t, formatMoney } = createI18n(DEFAULT_LOCALE);

// The lines of value of the flyer and the ads (G88, docs/193): the last lines of a shared message,
// after its facts, under an empty line.
export const withValue = (text: string, value: string) => `${text}\n\n${value}`;

// A future passenger: the number stays hidden, no app to download.
export const passengerValue = () => t('share.value.passenger');

// The drivers of a group: the price is theirs, no writing every 10 minutes; the bonus while the brand
// gives one, the sum as in the welcome of the driver bot.
export function driverValue(brand: BrandConfig): string {
  const bonus = brand.promo.amount * brand.promo.grants;
  const lines = [t('share.value.driver')];
  if (bonus > 0) lines.push(t('share.value.bonus', { bonus: formatMoney(bonus) }));
  return lines.join('\n');
}

// The people of a channel: the drivers the team checked, the number hidden (docs/04).
export const serviceValue = () => t('share.value.service');
