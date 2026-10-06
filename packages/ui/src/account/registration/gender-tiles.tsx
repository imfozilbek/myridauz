import type { Gender } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { IconTile } from '../../icon-tile';

type GenderTilesProps = {
  readonly value: Gender | null;
  readonly onChange: (gender: Gender) => void;
};

const GENDERS = ['male', 'female'] as const satisfies readonly Gender[];

// The gender in one tap: two big tiles side by side, the chosen one outlined in the color of the
// Mini App (G58, docs/118 variant A). Both tiles are the same size (docs/121).
export function GenderTiles({ value, onChange }: GenderTilesProps) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const outline = { borderColor: colors.brandStrong, background: colors.brandSoft };
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
            className="gender-tile"
            style={chosen ? outline : undefined}
            onClick={() => onChange(gender)}
          >
            <IconTile name={gender} size="tile" soft={!chosen} />
            <span>{t(`account.gender.${gender}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
