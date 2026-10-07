import type { PersonId } from '@platform/contracts';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { useFavorite } from './use-favorite';
import '../states/states.css';

type Props = { readonly driverId: PersonId; readonly screen: string };

// "Sevimli haydovchilarga qoʻshish" (docs/18): on the trip screen of a driver.
export function FavoriteCell({ driverId, screen }: Props) {
  const { t } = useI18n();
  const { saved, added, failure, toggle } = useFavorite(driverId, screen);
  // Until the list of saved drivers comes, the row keeps its place unseen: the reviews and the
  // buttons under it never jump (G41, docs/108).
  return (
    <Section
      footer={failure ? t(failure) : added ? t('comfort.favorite.added') : undefined}
      {...(saved === null ? { className: 'keep-place', 'aria-hidden': true } : {})}
    >
      <Cell before={<IconTile name="favorite" tone="accent" />} onClick={() => void toggle()}>
        {t(saved ? 'comfort.favorite.remove' : 'comfort.favorite.add')}
      </Cell>
    </Section>
  );
}
