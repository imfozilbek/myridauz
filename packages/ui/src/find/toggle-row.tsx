import { IconTile } from '../icon-tile';
import type { IconName } from '../icons';
import { Switch } from '../switch';

type Props = {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  // The rows of a new trip have an icon each (G63, mockup g63/1).
  readonly icon?: IconName;
};

// A row with a switch and a short line of what it does (G59 «Men bilan ayol bor», G61 the request).
export function ToggleRow({ label, hint, checked, onChange, icon }: Props) {
  return (
    <label className="seats-row seats-woman">
      {icon ? <IconTile name={icon} tone="mint" size="row" soft /> : null}
      <span className="seats-text">
        <span>{label}</span>
        <span className="seats-hint">{hint}</span>
      </span>
      <Switch aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
