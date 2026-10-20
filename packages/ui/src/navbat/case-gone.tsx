import { ApiError } from '@platform/api-client';
import { useCallback, useState } from 'react';
import { useI18n } from '../context/i18n-context';
import { isStale } from '../market/error-text';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';

// Another member decided the case meanwhile (G90 ADM-8): every decision of it fails for good.
const decidedElsewhere = (caught: unknown) =>
  isStale(caught) || (caught instanceof ApiError && caught.code === 'users.face_decided');

// The failure of a decision, as useFailure (G43): the reason stays on the screen; gone: the case was
// decided by another member, its decisions go.
export function useCaseFailure() {
  const { failure, fail, clear } = useFailure();
  const [gone, setGone] = useState(false);
  const failCase = useCallback(
    (caught: unknown) => {
      setGone(decidedElsewhere(caught));
      fail(caught);
    },
    [fail],
  );
  return { failure, fail: failCase, clear, gone };
}

// «Davom etish» instead of the decisions of a case decided already: the next case (G90 ADM-7, ADM-8).
export function NextCaseButton({ onClick }: { readonly onClick: () => void }) {
  const { t } = useI18n();
  return <MainButton text={t('common.continue')} onClick={onClick} />;
}
