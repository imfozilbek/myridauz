import type { BookedPlace, Booking, PlaceName, Point } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { openExternal } from '../telegram/feedback';
import { useNameText } from '../way/way-end';
import { mapUrl } from './map-link';

// The way and the points of a booking (G24, docs/70): fixed at the booking. The driver sees the
// area and the extra km until the confirmation, then the point that opens in a map.
export function BookingPlaces({ booking }: { readonly booking: Booking }) {
  const { t } = useI18n();
  const nameText = useNameText();
  const nameOf = (name: PlaceName | null) => nameText(name, '');
  const extra = booking.extraKm === null ? null : String(booking.extraKm);
  const cell = (label: string, icon: 'origin' | 'destination', title: string, point: Point | null) =>
    point ? (
      <Cell before={<IconTile name={icon} />} subtitle={title} onClick={() => openExternal(mapUrl(point))}>
        {label}
      </Cell>
    ) : (
      <Cell before={<IconTile name={icon} />} after={<CellValue>{title}</CellValue>}>
        {label}
      </Cell>
    );
  const described = (place: BookedPlace) => {
    if (place.point) return nameOf(place.name);
    const area = nameOf(place.area);
    return extra === null ? t('way.driver.areaOnly', { area }) : t('way.driver.area', { area, km: extra });
  };
  const { pitak, pickup, dropoff } = booking;
  if (!pitak && !pickup && !dropoff) return null;
  return (
    <Section footer={t('way.book.fixed')}>
      {pitak ? cell(t('way.book.pickup'), 'origin', pitak.name, pitak.point) : null}
      {!pitak && pickup ? cell(t('way.book.pickup'), 'origin', described(pickup), pickup.point) : null}
      {dropoff ? cell(t('way.book.dropoff'), 'destination', described(dropoff), dropoff.point) : null}
    </Section>
  );
}
