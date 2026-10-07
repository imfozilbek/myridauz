import { Switch } from '../switch';

type Props = {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
};

// A row with a switch and a short line of what it does (G59 «Men bilan ayol bor», G61 the request).
export function ToggleRow({ label, hint, checked, onChange }: Props) {
  return (
    <label className="seats-row seats-woman">
      <span className="seats-text">
        <span>{label}</span>
        <span className="seats-hint">{hint}</span>
      </span>
      <Switch aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
