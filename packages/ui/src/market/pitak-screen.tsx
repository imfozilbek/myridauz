import type { Pitak } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { PitakMap } from '../map/pitak-map';
import { Screen } from '../screen/screen';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import { brandVars } from '../theme/brand-vars';
import './pitak-screen.css';

type Props = {
  readonly pitak: Pitak;
  readonly hint: string;
  readonly onBack: () => void;
  readonly onPitak: () => void;
  readonly onDoor: () => void;
};

// «Xaritada ›» of the pitak of a new trip (G75, mockup g75/6 A, docs/126): the pitak on the big map
// and a sheet over it: «Shu pitakdan», or «Pitaksiz: faqat uyidan». «Назад» comes back to the trip.
export function PitakScreen({ pitak, hint, onBack, onPitak, onDoor }: Props) {
  useScreenView('market.pitak');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <div className="pitak-page" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="pitak-page-title">{t('way.trip.mode.title')}</h1>
      <PitakMap pitak={pitak} />
      <FormSheet open title={pitak.name} hint={hint} onClose={onBack}>
        <p className="pitak-page-note">{t('way.trip.pitakSeen')}</p>
        <button type="button" className="form-sheet-link" onClick={onDoor}>
          {t('way.trip.pitakNone')}
        </button>
        <MainButton text={t('way.trip.pitakThis')} onClick={onPitak} />
      </FormSheet>
    </div>
  );
}
