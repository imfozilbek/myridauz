import { useEffect, useState } from 'react';
import { Cell, Section } from '../components';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { IconTile } from '../icon-tile';
import { haptic } from '../telegram/feedback';

type Props = { readonly driverId: number; readonly screen: string };

// "Sevimli haydovchilarga qoʻshish" (docs/18): on the trip screen and after the review.
export function FavoriteCell({ driverId, screen }: Props) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { comfort } = useApiClients();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    comfort.favorites().then(
      ({ drivers }) => setSaved(drivers.some((driver) => driver.id === driverId)),
      () => setSaved(null),
    );
  }, [comfort, driverId]);
  if (saved === null) return null;
  const toggle = async () => {
    try {
      if (saved) await comfort.forget(driverId);
      else {
        await comfort.save(driverId);
        track({ name: 'favorite_driver', screen });
      }
      haptic.success();
      setAdded(!saved);
      setSaved(!saved);
    } catch {
      haptic.error();
    }
  };
  return (
    <Section footer={added ? t('comfort.favorite.added') : undefined}>
      <Cell before={<IconTile name="favorite" tone="accent" />} onClick={() => void toggle()}>
        {t(saved ? 'comfort.favorite.remove' : 'comfort.favorite.add')}
      </Cell>
    </Section>
  );
}
