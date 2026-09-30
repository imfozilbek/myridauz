import type { FoundPlace, Point } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { Cell, Input, Section } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import { usePlaceSearch } from './use-place-search';

const SEARCH_ICON_SIZE = 20;

type Props = { readonly near: Point; readonly onFound: (point: Point) => void };

// A place by name on the map (G23, docs/67): mahalla, street or landmark. The names are the ones
// of the map; near the start of the trip first. A tap moves the map, the pin stays in the middle.
export function MapSearch({ near, onFound }: Props) {
  const { t } = useI18n();
  const { map } = useApiClients();
  const { query, setQuery, result } = usePlaceSearch(map.search, near);
  const choose = (place: FoundPlace) => {
    haptic.tap();
    setQuery('');
    onFound(place.point);
  };
  return (
    <div className="pickup-map-search">
      <Input
        before={<Icon name="search" size={SEARCH_ICON_SIZE} />}
        placeholder={t('bookings.map.search')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {result.status === 'found' && result.places.length > 0 ? (
        <Section className="pickup-map-found">
          {result.places.map((place) => (
            <Cell
              key={`${place.name}|${place.point.lat}|${place.point.lng}`}
              before={<Icon name={place.kind} />}
              subtitle={
                place.area
                  ? t('bookings.map.foundIn', {
                      kind: t(`bookings.map.kind.${place.kind}`),
                      area: place.area,
                    })
                  : t(`bookings.map.kind.${place.kind}`)
              }
              onClick={() => choose(place)}
            >
              {place.name}
            </Cell>
          ))}
        </Section>
      ) : null}
      {result.status === 'found' && result.places.length === 0 ? (
        <Text role="status">{t('bookings.map.nothing')}</Text>
      ) : null}
      {result.status === 'failed' ? <Text role="alert">{t('bookings.map.searchFailed')}</Text> : null}
    </div>
  );
}
