import { DAY_MS, tashkentDate } from '@platform/contracts';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';
import { today, tomorrow } from './when';
import { WhenDays } from './when-days';
import '../places/places.css';
import './when-sheet.css';
import './date-step.css';

type DateStepProps = {
  readonly now: number;
  // Back from the next step, the day chosen before (docs/94 F8): its tile is pressed.
  readonly initial?: string;
  readonly onBack: () => void;
  readonly onDone: (date: string) => void;
};

// «Qaysi kuni?» of a request (G75, the day tiles of the mockup g75/3 A phone 1): «Bugun», «Ertaga» by
// one tap; «Boshqa» opens the phone calendar (docs/19).
export function DateStep({ now, initial, onBack, onDone }: DateStepProps) {
  useScreenView('market.date');
  useScreenBackground();
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const first = today(now);
  const last = tashkentDate(now + useBrand().schedule.daysAhead * DAY_MS);
  const known = initial && initial >= first && initial <= last ? initial : null;
  const listed = known === first || known === tomorrow(now);
  const [calendar, setCalendar] = useState(known !== null && !listed);
  // Never an empty field (a blank bar on an iPhone): the day after tomorrow, the first day the
  // tiles do not have; «Davom etish» is there at once (G37).
  const [other, setOther] = useState(known && !listed ? known : tomorrow(now + DAY_MS));
  const choose = (date: string) => {
    haptic.select();
    onDone(date);
  };
  return (
    <div className="places" style={brandVars(colors)}>
      <Screen onBack={calendar ? () => setCalendar(false) : onBack} />
      <h1 className="places-title">{t('market.date.title')}</h1>
      <WhenDays date={calendar ? other : known} now={now} onDay={choose} onOther={() => setCalendar(true)} />
      {calendar ? (
        <input
          className="date-step-field"
          type="date"
          aria-label={t('market.date.title')}
          min={first}
          max={last}
          value={other}
          onChange={(event) => setOther(event.target.value)}
        />
      ) : null}
      {calendar && other >= first && other <= last ? (
        <MainButton text={t('common.continue')} onClick={() => choose(other)} />
      ) : null}
      {!calendar && known ? <MainButton text={t('common.continue')} onClick={() => choose(known)} /> : null}
    </div>
  );
}
