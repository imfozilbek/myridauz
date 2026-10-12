import './manage-input.css';

type InputProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  // The keyboard of the phone: digits for a sum or a STIR, the @ for an email.
  readonly mode?: 'text' | 'numeric' | 'email';
  readonly maxLength?: number;
  // Red when the value does not pass the rules (G78 sheet 5, «Kompaniya rekvizitlari»).
  readonly invalid?: boolean;
  readonly autoFocus?: boolean;
};

// A field of «Boshqaruv» on a white card (G78 sheets 4 and 5): the gray name over the box.
export function ManageInput({
  label,
  value,
  onChange,
  mode = 'text',
  maxLength,
  invalid = false,
  autoFocus = false,
}: InputProps) {
  return (
    <label className={invalid ? 'manage-input manage-input-invalid' : 'manage-input'}>
      <span>{label}</span>
      <input
        value={value}
        inputMode={mode}
        type={mode === 'email' ? 'email' : 'text'}
        aria-invalid={invalid}
        {...(maxLength ? { maxLength } : {})}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
