import { useCallback, useEffect, useRef } from 'react';
import { useI18n } from '../context/i18n-context';
import { confirm } from '../telegram/feedback';
import { holdClosing } from './closing';

// A form with typed or chosen data and no draft (docs/94 F3): Telegram asks before closing, and
// «Назад» out of the form asks «Oʻzgarishlar saqlanmaydi. Chiqasizmi?». Untouched, nothing asks.
export function useUnsavedGuard(dirty: boolean) {
  const { t } = useI18n();
  const touched = useRef(dirty);
  touched.current = dirty;
  useEffect(() => {
    return dirty ? holdClosing() : undefined;
  }, [dirty]);
  return useCallback(
    (leave: () => void) => () => {
      if (!touched.current) return leave();
      void confirm(t('common.unsaved'), t('common.back')).then((yes) => yes && leave());
    },
    [t],
  );
}
