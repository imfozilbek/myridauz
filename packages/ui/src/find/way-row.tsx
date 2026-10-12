import type { IconName } from '../icons';
import { Icon } from '../icons';

// The tile of a row: an icon on its color, or the picture of a channel.
type Lead = IconName | { readonly src: string; readonly alt: string };

type Props = {
  readonly icon: Lead;
  readonly title: string;
  readonly hint: string;
  // «Hozircha safar yoʻq» is gray, «Obuna boʻldingiz» green (G78 sheet 2); neither is tapped.
  readonly tone?: 'brand' | 'muted' | 'done';
  readonly iconSize?: number;
  readonly onClick?: () => void;
};

// A way to know about new trips (docs/119): «Xabar bering», «Soʻrov qoldirish», the channel. A row
// with its tile, a bold name, one line why, and the arrow when it is tapped (mockup 7-channels-1).
export function WayRow({ icon, title, hint, tone = 'brand', iconSize = 20, onClick }: Props) {
  const lead =
    typeof icon === 'string' ? (
      <span className={`way-row-icon way-row-icon-${tone}`}>
        <Icon name={icon} size={iconSize} />
      </span>
    ) : (
      <img className="way-row-art" src={icon.src} alt={icon.alt} />
    );
  const words = (
    <span className="way-row-text">
      <span className="way-row-title">{title}</span>
      <span className="way-row-hint">{hint}</span>
    </span>
  );
  if (!onClick)
    return (
      <div className={`way-row way-row-${tone}`}>
        {lead}
        {words}
      </div>
    );
  return (
    <button type="button" className="way-row" onClick={onClick}>
      {lead}
      {words}
      <Icon name="next" size={18} />
    </button>
  );
}
