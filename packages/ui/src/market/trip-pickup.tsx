import { PICKUP_MODES, type PickupMode, type Pitak } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { haptic } from '../telegram/feedback';
import { TripRow } from './trip-row';
import './trip-pickup.css';

type Props = {
  readonly mode: PickupMode;
  readonly pitak: Pitak | null;
  // The short name of the region the trip goes to: «Samarqand yoʻnalishi pitagi» (mockup g63/2).
  readonly direction: string;
  readonly onMode: (mode: PickupMode) => void;
  readonly onMap: () => void;
};

// «Qayerdan olasiz?» (G63, mockup g63/2, docs/70, docs/72): the pitak, the doors or both. The driver
// never chooses the pitak: the system takes the main one of the direction and its card opens it on
// the map. A direction without a pitak has the doors only: the other two are not offered.
export function TripPickup({ mode, pitak, direction, onMode, onMap }: Props) {
  const { t } = useI18n();
  const modes = pitak ? PICKUP_MODES : (['door'] as const);
  const choose = (next: PickupMode) => {
    haptic.select();
    onMode(next);
  };
  return (
    <TripRow icon="destination" label={t('way.trip.mode.title')}>
      <div className="trip-chips" role="radiogroup" aria-label={t('way.trip.mode.title')}>
        {modes.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            className="trip-chip"
            aria-checked={each === mode}
            onClick={() => choose(each)}
          >
            {t(`way.trip.mode.${each}`)}
          </button>
        ))}
      </div>
      {pitak && mode !== 'door' ? (
        <button type="button" className="trip-pitak" onClick={onMap}>
          <span className="trip-pitak-words">
            <b>{pitak.name}</b>
            <span>{t('way.trip.pitak', { direction })}</span>
          </span>
          <span className="trip-pitak-map">
            {t('way.trip.onMap')}
            <Icon name="next" size={10} />
          </span>
        </button>
      ) : (
        <p className="trip-door">{t('way.trip.mode.doorHint')}</p>
      )}
    </TripRow>
  );
}
