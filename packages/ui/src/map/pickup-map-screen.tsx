import { insideUzbekistan, type Booking, type Point } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { Caption, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { Button } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { errorKey } from '../market/error-text';
import { usePlacePoint } from '../market/places-gate';
import { EmptyState } from '../states/empty-state';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { requestPosition } from '../telegram/location';
import { useMapView } from './use-map-view';
import './pickup-map.css';

const PIN_SIZE = 44;
// Where the map opens when nothing better is known: the center of Tashkent.
const TASHKENT: Point = { lat: 41.3111, lng: 69.2797 };

type Props = { readonly booking: Booking; readonly onBack: () => void; readonly onSaved: () => void };

// The passenger moves the map under the pin and says "Shu yerda" (G22, docs/14): the driver
// gets the point at once. The map opens at the chosen point, the meeting point or the town.
export function PickupMapScreen({ booking, onBack, onSaved }: Props) {
  useScreenView('bookings.map');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const { map, bookings } = useApiClients();
  const placePoint = usePlacePoint();
  const start = booking.pickup ?? booking.meetingPoint ?? placePoint(booking.trip.from) ?? TASHKENT;
  const { box, view, failed, retry } = useMapView(map, start);
  const [note, setNote] = useState<TranslationKey | null>(null);
  useEffect(() => view?.onMove(() => setNote(null)), [view]);
  const locate = async () => {
    setNote(null);
    const here = await requestPosition();
    if (here) view?.moveTo(here);
    else setNote('bookings.map.noLocation');
  };
  const save = async () => {
    if (!view) return;
    const point = view.center();
    if (!insideUzbekistan(point)) return setNote('bookings.map.outside');
    try {
      await bookings.setPickup(booking.id, point);
      haptic.success();
      return onSaved();
    } catch (caught) {
      haptic.error();
      return setNote(errorKey(caught));
    }
  };
  if (failed) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState
          icon="error"
          title={t('bookings.map.failed')}
          description={t('bookings.map.failedHint')}
          action={
            <Button size="m" onClick={retry}>
              {t('common.retry')}
            </Button>
          }
        />
      </>
    );
  }
  return (
    <div className="pickup-map">
      <BackButton onClick={onBack} />
      <div ref={box} className="pickup-map-box" data-state={view ? 'ready' : 'loading'} />
      <div className="pickup-map-pin">
        <Icon name="pickup" size={PIN_SIZE} color={colors.accent} filled />
      </div>
      <div className="pickup-map-top">
        <div className="pickup-map-panel">
          <Text weight="2">{t('bookings.map.title')}</Text>
          <Caption>{t('bookings.map.hint')}</Caption>
        </div>
        {note ? (
          <Text className="pickup-map-panel" role="alert">
            {t(note)}
          </Text>
        ) : null}
        <Button mode="white" size="m" before={<Icon name="locate" />} onClick={() => void locate()}>
          {t('bookings.map.mine')}
        </Button>
      </div>
      <Caption className="pickup-map-credit">{t('bookings.map.credit')}</Caption>
      {view ? <MainButton text={t('bookings.map.here')} onClick={save} /> : null}
    </div>
  );
}
