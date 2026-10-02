import { useState } from 'react';
import { Snackbar } from '../components';
import { useI18n } from '../context/i18n-context';

// Long enough to read it on the first step shown again.
const SHOWN_MS = 6000;

// «Oldingi yozganingiz tiklandi.» over the step a draft brought back (docs/94 F3). It stays while
// the person moves on, so a path keeps it next to its steps, not inside one of them.
export function DraftRestored({ shown }: { readonly shown: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(shown);
  if (!open) return null;
  return (
    <Snackbar duration={SHOWN_MS} onClose={() => setOpen(false)}>
      {t('common.draftRestored')}
    </Snackbar>
  );
}
