import type { IconName } from '../icons';
import { Icon } from '../icons';

type Props = {
  readonly icon: IconName;
  readonly title: string;
  readonly hint: string;
  readonly onClick: () => void;
};

// A way to know about new trips (docs/119): «Xabar bering», «Soʻrov qoldirish». A row with its icon,
// a bold name, one line why, and the arrow (mockup 7-channels-1).
export function WayRow({ icon, title, hint, onClick }: Props) {
  return (
    <button type="button" className="way-row" onClick={onClick}>
      <span className="way-row-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="way-row-text">
        <span className="way-row-title">{title}</span>
        <span className="way-row-hint">{hint}</span>
      </span>
      <Icon name="next" size={18} />
    </button>
  );
}
