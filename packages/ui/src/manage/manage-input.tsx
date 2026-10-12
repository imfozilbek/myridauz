import './manage-input.css';

type InputProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly numeric?: boolean;
  readonly autoFocus?: boolean;
};

// A field of «Boshqaruv» on a white card (G78 sheet 4): the gray name over the box.
export function ManageInput({ label, value, onChange, numeric = false, autoFocus = false }: InputProps) {
  return (
    <label className="manage-input">
      <span>{label}</span>
      <input
        value={value}
        inputMode={numeric ? 'numeric' : 'text'}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
