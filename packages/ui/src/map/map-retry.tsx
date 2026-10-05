import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';

// A small map that did not load (G43, docs/65 B3): the screen says so, a tap draws it again.
// The rest of the screen works without the map.
export function MapRetry({ onRetry }: { readonly onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert">
      <Section>
        <Cell before={<Icon name="error" />} subtitle={t('common.retry')} onClick={onRetry}>
          {t('bookings.map.failed')}
        </Cell>
      </Section>
    </div>
  );
}
