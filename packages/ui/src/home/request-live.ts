import { REQUEST_LINK } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { TileLive } from '../flow/start-action';
import { usePlaceNames } from '../places/place-names';
import { useDirectory } from '../places/use-directory';
import { useRequestDay } from '../requests/request-day';
import { waitingOffers } from './home-items';
import { usePassengerData } from './passenger-data';

// «Soʻrov qoldirish» becomes «Soʻrovim» while a request is open (G66, docs/118, mockup g66/1 phone 3):
// where and when («bugun», «ertaga», «9-okt») it goes, how many drivers offered; a tap opens the request with its offers.
export function useRequestLive(): TileLive {
  const { t } = useI18n();
  const day = useRequestDay();
  const { value } = usePassengerData();
  const [places] = useDirectory();
  const names = usePlaceNames(places.status === 'ready' ? places.directory : null);
  if (!value) return {};
  const [, requests, offers] = value;
  const waiting = waitingOffers(requests, offers);
  const open = [...requests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((request) => request.status === 'open');
  if (!open || places.status !== 'ready') return { badge: waiting.length };
  const to = places.directory.find(open.to);
  const when = t('home.request.when', {
    to: to ? names.toward(to) : '',
    date: day(open.date),
  });
  const count = waiting.filter((offer) => offer.requestId === open.id).length;
  return {
    title: t('home.request.title'),
    hint: count > 0 ? t('home.meta', { when, more: t('market.request.offers', { count: String(count) }) }) : when,
    badge: count,
    opens: { id: 'my_trips', launch: { link: { name: REQUEST_LINK, id: open.id } } },
  };
}
