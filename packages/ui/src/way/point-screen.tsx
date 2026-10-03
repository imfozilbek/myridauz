import type { Location, Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components';
import { useAnalytics, useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MapSearch } from '../map/map-search';
import { useMapView } from '../map/use-map-view';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { MapFailed } from './map-failed';
import { RecentList } from './recent-list';
import { rememberPlace } from './recent-places';
import { useWhere } from './use-where';
import { useClip } from './use-clip';
import { useFindMe } from './use-find-me';
import { useNameText, type WayEnd } from './way-end';
import '../map/pickup-map.css';
import './way.css';

const PIN_SIZE = 44;
type Method = 'map' | 'search' | 'location' | 'recent';

type Props = {
  readonly title: TranslationKey;
  readonly start: Point;
  readonly find: (id: string) => Location | undefined;
  // A booking (G26, docs/74): the map, the search and the last places stay inside this district or
  // region; the point is checked against it.
  readonly zone?: Location;
  // A new pickup (G35, docs/97 PS12): the map moves to the person when it can.
  readonly findMe?: boolean;
  readonly onBack: () => void;
  readonly onPick: (end: WayEnd) => void;
};

// One point on the map (G24, docs/71): the pin in the middle, its name under it, the map of its
// district only. Search, the last places and «Mening joylashuvim» move the map; «Shu yerda» takes it.
export function PointScreen({ title, start, find: findAny, zone, findMe = false, onBack, onPick }: Props) {
  useScreenView('way.point');
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { colors } = useBrand().theme;
  const { map } = useApiClients();
  const { box, view, failed, retry } = useMapView(map, start);
  const find = (id: string) => {
    const found = findAny(id);
    return !zone || id === zone.id || found?.parentId === zone.id ? found : undefined;
  };
  const { where, asking } = useWhere(view);
  const nameText = useNameText();
  const [note, setNote] = useState<TranslationKey | null>(null);
  const method = useRef<Method>('map');
  const district = where?.district ?? null;
  // A new place under the pin: an old note about the last one is gone.
  useEffect(() => setNote(null), [where]);
  const unclip = useClip(view, where, zone?.id ?? null);
  const moveTo = (point: Point, how: Method) => {
    method.current = how;
    setNote(null);
    unclip();
    view?.moveTo(point);
  };
  useFindMe(
    view,
    (district) => find(district) !== undefined,
    (point) => moveTo(point, 'location'),
    findMe,
  );
  const locate = async () => {
    const here = await requestPosition();
    if (here) moveTo(here, 'location');
    else setNote('way.point.noLocation');
  };
  const place = district ? find(district) : undefined;
  const outside = zone ? 'way.point.outsideZone' : 'way.point.outside';
  const take = () => {
    // No name yet (slow internet): wait, the point is not outside (lesson 77).
    if (!view || !where) return undefined;
    if (!place) return (haptic.error(), setNote(outside));
    const point = view.center();
    track({ name: 'place_point_saved', screen: 'way.point', method: method.current });
    rememberPlace({ point, name: where.name, district: place.id });
    haptic.success();
    return onPick({ place, point, name: where.name });
  };
  if (failed) return <MapFailed onBack={onBack} onRetry={retry} />;
  return (
    <div className="pickup-map">
      <Screen onBack={onBack} />
      <div ref={box} className="pickup-map-box" data-state={view ? 'ready' : 'loading'} />
      <div className="pickup-map-pin">
        <Icon name="pickup" size={PIN_SIZE} color={colors.accent} filled />
      </div>
      <Text className="way-pin-name" role="status">
        {asking || !where
          ? t('way.point.finding')
          : place
            ? nameText(where.name, place)
            : t(outside, { zone: zone?.name ?? '' })}
      </Text>
      <div className="pickup-map-top">
        <div className="pickup-map-panel">
          <Text weight="2">{t(title)}</Text>
          <Caption>{t('way.point.hint')}</Caption>
          <MapSearch
            near={start}
            {...(zone ? { zone: zone.id } : {})}
            onFound={(point) => moveTo(point, 'search')}
          />
          <RecentList find={find} onChoose={(point) => moveTo(point, 'recent')} />
        </div>
        {note ? (
          <Text className="pickup-map-panel" role="alert">
            {t(note, { zone: zone?.name ?? '' })}
          </Text>
        ) : null}
        <Button mode="white" size="m" before={<Icon name="locate" />} onClick={() => void locate()}>
          {t('way.point.mine')}
        </Button>
      </div>
      <Caption className="pickup-map-credit">{t('bookings.map.credit')}</Caption>
      {view ? <MainButton text={t('way.point.here')} onClick={take} /> : null}
    </div>
  );
}
