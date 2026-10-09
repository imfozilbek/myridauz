import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';

// "Sevimli haydovchilar" lives inside the passenger's "Mening safarlarim" (docs/18).
export function FavoritesEntry({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell
        before={<IconTile name="favorite" tone="accent" />}
        subtitle={t('comfort.favorites.hint')}
        onClick={onOpen}
      >
        {t('comfort.favorites.title')}
      </Cell>
    </Section>
  );
}
