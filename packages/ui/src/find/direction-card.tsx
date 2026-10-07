import type { DirectionCard as Card, Location } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { useRegionArt } from '../places/region-art';

type Props = { readonly card: Card; readonly region: Location; readonly name: string; readonly onOpen: () => void };

// A main direction (docs/118, path 2): the drawing of the region, its name under it on white, the
// trips of today and tomorrow and «… soʻmdan». Text never lies on the picture.
export function DirectionCard({ card, region, name, onOpen }: Props) {
  const { t, formatMoney } = useI18n();
  const art = useRegionArt()(region.id);
  const trips =
    card.today > 0 && card.tomorrow > 0
      ? t('find.tripsBoth', { today: String(card.today), tomorrow: String(card.tomorrow) })
      : card.today > 0
        ? t('find.tripsToday', { count: String(card.today) })
        : card.tomorrow > 0
          ? t('find.tripsTomorrow', { count: String(card.tomorrow) })
          : t('find.noTrips');
  return (
    <Tappable Component="button" className="direction-card" onClick={onOpen}>
      {art ? <img className="direction-art" src={art} alt={name} /> : null}
      <span className="direction-body">
        <span className="direction-text">
          <span className="direction-name">{name}</span>
          <span className="direction-trips">{trips}</span>
        </span>
        <span className="direction-price">
          {t('find.priceFrom', { price: formatMoney(card.price) })}
        </span>
      </span>
    </Tappable>
  );
}
