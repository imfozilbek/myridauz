import type { PersonId } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import { useEffect, useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { errorKey } from '../market/error-text';
import { haptic } from '../telegram/feedback';

// «Sevimli haydovchi» (docs/18): is the driver saved, and one tap to save or forget. Null until the
// list came: the row keeps its place unseen (G41, docs/108).
export function useFavorite(driverId: PersonId, screen: string) {
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
  return { saved, added, failure, toggle };
}
