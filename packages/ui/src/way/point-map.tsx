import type { Point } from '@platform/contracts';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import type { RefObject } from 'react';
import { Button } from '../components';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { MapSearch } from '../map/map-search';

const PIN_SIZE = 44;

type Props = {
  readonly box: RefObject<HTMLDivElement>;
  readonly ready: boolean;
  readonly start: Point;
  readonly zone: string | undefined;
  // A note over the map: outside the zone, no location (shown as an alert).
  readonly note: string | null;
  readonly onFound: (point: Point) => void;
  readonly onLocate: () => void;
};

// The map of one point (docs/126): the search on top, the pin of the color of the app in the middle,
// «Joylashuvim» at the edge, the credit of OpenStreetMap.
export function PointMap({ box, ready, start, zone, note, onFound, onLocate }: Props) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <div className="way-map">
      <div ref={box} className="pickup-map-box" data-state={ready ? 'ready' : 'loading'} />
      <div className="pickup-map-pin">
        <Icon name="pickup" size={PIN_SIZE} color={colors.brandStrong} filled />
      </div>
      <div className="way-top">
        <MapSearch near={start} {...(zone ? { zone } : {})} onFound={onFound} />
      </div>
      {note ? (
        <Text className="way-note" role="alert">
          {note}
        </Text>
      ) : null}
      <Button className="way-locate" mode="white" size="s" before={<Icon name="locate" />} onClick={onLocate}>
        {t('way.point.locate')}
      </Button>
      <Caption className="pickup-map-credit">{t('bookings.map.credit')}</Caption>
    </div>
  );
}
