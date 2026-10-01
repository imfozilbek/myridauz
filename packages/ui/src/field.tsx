import { Input, type InputProps } from '@telegram-apps/telegram-ui';
import { Section } from './section';

type FieldProps = InputProps & { readonly label: string };

// A field with its label as the header of its section: TelegramUI hides the header of a field on
// iOS, the section header shows on every platform and wraps a long label (G27).
export function Field({ label, ...input }: FieldProps) {
  return (
    <Section header={label}>
      <Input aria-label={label} {...input} />
    </Section>
  );
}
