import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { noonOf, today, tomorrow } from './when';

type Props = {
  readonly date: string;
  readonly now: number;
  readonly onDay: (date: string) => void;
  readonly onOther: () => void;
};

// «Bugun», «Ertaga», «Boshqa kun» as three tiles with the short date under each (G75, mockup g75/3 A
// phone 1); another day from the phone calendar shows its date on the third tile.
export function WhenDays({ date, now, onDay, onOther }: Props) {
  const { t, formatShortDate } = useI18n();
  const short = (day: string) => formatShortDate(noonOf(day));
  const known = date === today(now) || date === tomorrow(now);
  const tile = (selected: boolean, title: string, small: string, onClick: () => void) => (
    <button
      type="button"
      className="when-day"
      aria-pressed={selected}
      onClick={() => {
        haptic.select();
        onClick();
      }}
    >
      <span>{title}</span>
      <small>{small}</small>
    </button>
  );
  return (
    <div className="when-days">
      {tile(date === today(now), t('market.day.today'), short(today(now)), () => onDay(today(now)))}
      {tile(date === tomorrow(now), t('market.day.tomorrow'), short(tomorrow(now)), () =>
        onDay(tomorrow(now)),
      )}
      {tile(!known, t('market.day.other'), known ? t('market.day.otherHint') : short(date), onOther)}
    </div>
  );
}
