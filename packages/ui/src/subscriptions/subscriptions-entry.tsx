import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// "Obunalar" lives inside "Mening safarlarim", not on the main screen (docs/24).
export function SubscriptionsEntry({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell
        before={<IconTile name="subscriptions" />}
        subtitle={t('subscriptions.entryHint')}
        onClick={onOpen}
      >
        {t('subscriptions.title')}
      </Cell>
    </Section>
  );
}
