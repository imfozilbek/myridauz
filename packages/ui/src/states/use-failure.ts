import type { TranslationKey } from '@platform/i18n';
import { useCallback, useState } from 'react';
import { errorKey } from '../market/error-text';
import { haptic } from '../telegram/feedback';

// The reason of an action that did not work, for ActionFailure (G43, docs/65 B3): the phone
// shakes once and the screen says why; the next try clears it.
export function useFailure() {
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const fail = useCallback((caught: unknown) => {
    haptic.error();
    setFailure(errorKey(caught));
  }, []);
  const clear = useCallback(() => setFailure(null), []);
  return { failure, fail, clear };
}
