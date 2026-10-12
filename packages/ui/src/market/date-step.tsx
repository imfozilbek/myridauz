import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { weekOf } from '../days/week';
import { WeekRow } from '../days/week-row';
import { Screen } from '../screen/screen';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import '../places/places.css';

type DateStepProps = {
  readonly now: number;
  // Back from the next step, the day chosen before (docs/94 F8): it stands out.
  readonly initial?: string;
  readonly onBack: () => void;
  readonly onDone: (date: string) => void;
};

// «Qaysi kuni?» of a request: the row of the week from today (owner decision 12.10.2026, docs/172,
// mockup 6-days phone 4); a tap on a day is the next step, a request goes no further (docs/127).
export function DateStep({ now, initial, onBack, onDone }: DateStepProps) {
  useScreenView('market.date');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const week = weekOf(now);
  const known = initial && week.includes(initial) ? initial : null;
  return (
    <div className="places" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="places-title">{t('market.date.title')}</h1>
      <WeekRow days={week.map((date) => ({ date, marked: false }))} on={known} onPick={onDone} />
    </div>
  );
}
