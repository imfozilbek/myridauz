import type { AdLink } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { shownName } from '../../channels/channel-name';

// The words of an ad link (docs/184): its terms, where it leads, what one person on the list cost.
export function useAdWords() {
  const { t, formatDate, formatMoney } = useI18n();
  const brand = useBrand();
  const channelName = (chat: string | null) => {
    if (chat === `@${brand.mainChannel}`) return t('waitlist.channels.mainName', { brand: brand.name });
    const own = brand.channels.find((channel) => channel.chat === chat);
    return own ? shownName(brand, own.name) : (chat ?? '');
  };
  const terms = (ad: Pick<AdLink, 'days' | 'top' | 'pin'>) =>
    [
      ad.days === null ? t('ads.forever') : t('ads.day', { n: ad.days }),
      ...(ad.top > 0 ? [t('ads.topShort', { n: ad.top })] : []),
      ...(ad.pin > 0 ? [t('ads.pinShort', { n: ad.pin })] : []),
    ].join(' · ');
  const target = (ad: Pick<AdLink, 'target' | 'channel'>, named = false) =>
    ad.target === 'bot'
      ? t('ads.toBot')
      : named
        ? t('ads.toChannelNamed', { channel: channelName(ad.channel) })
        : t('ads.toChannel');
  const where = (ad: AdLink, named = false) =>
    [t(`ads.place.${ad.place}`), formatDate(new Date(ad.at)), target(ad, named)].join(' · ');
  // One person on the list or one subscriber: the price parted; nothing without a price.
  const per = (price: number | null, people: number) =>
    price === null || people === 0 ? '' : formatMoney(Math.round(price / people));
  return { channelName, terms, target, where, per };
}

export const listedOf = (ad: AdLink) => ad.result.passengers + ad.result.drivers;
