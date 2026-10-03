import type { PersonId } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { haptic } from '../telegram/feedback';
import type { TranslationKey } from '@platform/i18n';
import { errorKey } from '../market/error-text';
import '../states/states.css';

type Props = { readonly driverId: PersonId; readonly screen: string };

// "Sevimli haydovchilarga qoʻshish" (docs/18): on the trip screen and after the review.
export function FavoriteCell({ driverId, screen }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { comfort } = useApiClients();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [added, setAdded] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  useEffect(() => {
    comfort.favorites().then(
      ({ drivers }) => setSaved(drivers.some((driver) => driver.id === driverId)),
      () => setSaved(null),
    );
  }, [comfort, driverId]);
  const toggle = async () => {
    try {
      setFailure(null);
      if (saved) await comfort.forget(driverId);
      else {
        await comfort.save(driverId);
        track({ name: 'favorite_driver', screen });
      }
      haptic.success();
      setAdded(!saved);
      setSaved(!saved);
    } catch (caught) {
      // The 51st saved driver hears why, not silence (docs/86 T3).
      haptic.error();
      setFailure(errorKey(caught));
    }
  };
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
