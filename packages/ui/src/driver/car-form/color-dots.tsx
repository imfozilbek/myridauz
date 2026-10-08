import { CAR_COLORS, type CarColor } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';

type Props = { readonly value: CarColor | undefined; readonly onPick: (color: CarColor) => void };

// The color as round paint dots (mockup g62/1, screen 2); the name of the chosen one is in the label.
export function ColorDots({ value, onPick }: Props) {
  const { t } = useI18n();
  const paint = useBrand().theme.carColors;
  return (
    <div className="car-colors">
      {CAR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="car-color"
          aria-label={t(`drivers.color.${color}`)}
          aria-pressed={color === value}
          style={{ background: paint[color] }}
          onClick={() => {
            haptic.select();
            onPick(color);
          }}
        />
      ))}
    </div>
  );
}
