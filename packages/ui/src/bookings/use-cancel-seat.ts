import type { TranslationKey } from '@platform/i18n';
import { useState } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { errorKey, isStale } from '../market/error-text';
import { confirm, haptic } from '../telegram/feedback';

type Done = { readonly onDone: () => void; readonly onStale?: (() => void) | undefined };

// The cancel of a seat by its passenger (G77): the page of the seat and the request just sent cancel
// the same way. Asked first, one tap never loses a seat (docs/65 B4); counted; a failure says why and
// keeps the screen (docs/65 B3).
export function useCancelSeat(id: string, { onDone, onStale }: Done) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const { bookings } = useApiClients();
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const cancel = async () => {
    if (!(await confirm(t('bookings.cancelAsk'), t('bookings.cancel')))) return;
    try {
      setFailure(null);
      await bookings.cancelMine(id);
      haptic.success();
      track({ name: 'booking_step', screen: 'bookings.passenger', step: 'cancelled' });
      onDone();
    } catch (caught) {
      haptic.error();
      setFailure(errorKey(caught));
      if (isStale(caught)) onStale?.();
    }
  };
  return { cancel: () => void cancel(), failure };
}
