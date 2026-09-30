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

// "Safarlar tarixi" lives in the profile of a passenger and of a driver (docs/18).
export function HistoryEntry({ onOpen }: { readonly onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Section>
      <Cell before={<IconTile name="history" />} subtitle={t('comfort.history.hint')} onClick={onOpen}>
        {t('comfort.history.title')}
      </Cell>
    </Section>
  );
}
