import type { DirectionCard as Card } from '@platform/contracts';
import { Tappable } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';
import { useFitLine } from '../screen/fit-line';

type Props = {
  readonly card: Card;
  readonly name: string;
  readonly onOpen: () => void;
};

// A direction (docs/118, path 2): the name of the region and its trips of today and tomorrow, in a
// tile of two columns, so that every region fits one screen (owner, 12.11.2026). No price for now.
export function DirectionCard({ card, name, onOpen }: Props) {
  const { t } = useI18n();
  // «Qoraqalpogʻiston» is one long word: smaller on a narrow phone, never broken (docs/121).
  const fitted = useFitLine<HTMLSpanElement>(name);
  const trips =
    card.today > 0 && card.tomorrow > 0
      ? t('find.tripsBoth', { today: String(card.today), tomorrow: String(card.tomorrow) })
      : card.today > 0
        ? t('find.tripsToday', { count: String(card.today) })
        : card.tomorrow > 0
          ? t('find.tripsTomorrow', { count: String(card.tomorrow) })
          : t('find.noTrips');
  return (
    <Tappable
      Component="button"
      className="direction-card"
      data-trips={card.today + card.tomorrow > 0}
      onClick={onOpen}
    >
      <span ref={fitted} className="direction-name">
        {name}
      </span>
      <span className="direction-trips">{trips}</span>
    </Tappable>
  );
}
