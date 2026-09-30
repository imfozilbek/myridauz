import type { TranslationKey } from '@platform/i18n';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

// An action that did not work: the screen stays, the reason is on it, the button can be tapped
// again (docs/65 B3). Never a closed screen that leaves the person guessing.
export function ActionFailure({ error }: { readonly error: TranslationKey | null }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <div role="alert">
      <Section>
        <Cell multiline before={<Icon name="error" />}>
          {t(error)}
        </Cell>
      </Section>
    </div>
  );
}
