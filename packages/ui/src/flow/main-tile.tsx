import type { CSSProperties } from 'react';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';
import './main-tile.css';

const ICON = 22;

type Props = {
  readonly icon: IconName;
  readonly title: string;
  readonly hint: string;
  readonly onClick: () => void;
};

// The one big tile in the color of the app above the others (G62, mockup g62/1 screens 1 and 6):
// «Haydovchi boʻlish» before the application, «Safar eʼlon qilish» once it is approved.
export function MainTile({ icon, title, hint, onClick }: Props) {
  const { colors } = useBrand().theme;
  const style = { '--main-tile': colors.brandStrong, '--main-tile-ink': colors.bg } as CSSProperties;
  return (
    <button type="button" className="main-tile" style={style} onClick={onClick}>
      <span className="main-tile-icon">
        <Icon name={icon} size={ICON} />
      </span>
      <span className="main-tile-title">{title}</span>
      <span className="main-tile-hint">{hint}</span>
    </button>
  );
}
