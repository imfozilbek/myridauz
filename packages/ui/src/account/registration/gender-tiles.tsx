import './gender.css';
import type { Gender } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Icon } from '../../icons';

type GenderTilesProps = {
  readonly value: Gender | null;
  readonly onChange: (gender: Gender) => void;
};

const GENDERS = ['male', 'female'] as const satisfies readonly Gender[];
const ICON = 24;

// The gender in one tap: two big tiles side by side, the chosen one outlined in the color of the
// Mini App (G58, docs/118 variant A). Both tiles are the same size (docs/121).
export function GenderTiles({ value, onChange }: GenderTilesProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  return (
    <div className="gender-tiles" role="radiogroup">
      {GENDERS.map((gender) => {
        const chosen = gender === value;
        return (
          <button
            key={gender}
            type="button"
            role="radio"
            aria-checked={chosen}
            className={chosen ? 'gender-tile gender-tile-on' : 'gender-tile'}
            onClick={() => onChange(gender)}
          >
            <span className="gender-icon">
              <Icon name={gender} size={ICON} color={chosen ? colors.bg : colors.brandText} />
            </span>
            {t(`account.gender.${gender}`)}
          </button>
        );
      })}
    </div>
  );
}
