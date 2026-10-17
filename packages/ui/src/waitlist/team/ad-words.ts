import { AD_BOTS, type AdLink } from '@platform/contracts';
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
  const target = (ad: Pick<AdLink, 'target' | 'channel'>, named = false) => {
    if (ad.target === 'channel')
      return named ? t('ads.toChannelNamed', { channel: channelName(ad.channel) }) : t('ads.toChannel');
    if (ad.target === 'passenger') return t('ads.toPassenger');
    return ad.target === 'driver' ? t('ads.toDriver') : t('ads.toBot');
  };
  const where = (ad: AdLink, named = false) =>
    [t(`ads.place.${ad.place}`), formatDate(new Date(ad.at)), target(ad, named)].join(' · ');
  // One person on the list or one subscriber: the price parted; nothing without a price.
  const per = (price: number | null, people: number) =>
    price === null || people === 0 ? '' : formatMoney(Math.round(price / people));
  return { channelName, terms, target, where, per };
}

// A link into a bot of the trips (owner, 17.10.2026): it leads to a registration, not to the list.
export const intoTrips = (ad: Pick<AdLink, 'target'>) => (AD_BOTS as readonly string[]).includes(ad.target);
// The people an ad brought for its price: registered by a link into a bot of the trips, else on the list.
export const listedOf = (ad: AdLink) =>
  intoTrips(ad) ? ad.result.registered : ad.result.passengers + ad.result.drivers;
