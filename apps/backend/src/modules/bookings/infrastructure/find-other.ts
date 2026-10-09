import type { BrandConfig } from '@platform/brands';
import { FIND_LINK, requestsLinkValue, tashkentDate, type Booking } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { appButton } from '../../../shared/telegram/open-button';

const { t } = createI18n(DEFAULT_LOCALE);

// A seat that ended: the button leads to the trips of the same route and day (docs/89 S10).
export const findOtherButton = (brand: BrandConfig, { trip }: Booking) =>
  appButton(brand, 'passenger', t('bot.findOther'), {
    name: FIND_LINK,
    id: requestsLinkValue(trip.from, trip.to, tashkentDate(trip.departAt)),
  });

// «Qaytish safari» under an arrived seat (docs/122): the trips back, from the day of the arrival.
export const backButton = (brand: BrandConfig, { trip }: Booking, now: number) =>
  appButton(brand, 'passenger', t('bot.card.back'), {
    name: FIND_LINK,
    id: requestsLinkValue(trip.to, trip.from, tashkentDate(now)),
  });
