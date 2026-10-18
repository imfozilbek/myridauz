import { CANCEL_REASONS, type CancelReason } from '@platform/contracts';
import { useEffect } from 'react';
import { useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ChoiceRows } from '../sheet/choice-rows';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import { closeReason, useAskedReason } from './ask-reason';
import { reasonWords } from './reason-words';

// «Nima uchun?» (G87 V3, docs/191): a tap on a reason counts it and closes the sheet; the main button,
// a swipe or a tap on the shade skip it. Only the reason is counted, never the person (docs/29).
export function ReasonSheet() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const what = useAskedReason();
  // An app that closes drops its question: the step that asked it goes on.
  useEffect(() => {
    return closeReason;
  }, []);
  const keys: readonly CancelReason[] = what ? CANCEL_REASONS[what] : [];
  const choices = what ? keys.map((key) => ({ key, title: reasonWords(t, what, key) })) : [];
  return (
    <FormSheet
      open={what !== null}
      title={t('cancelReason.title')}
      hint={t('cancelReason.hint')}
      onClose={closeReason}
    >
      <ChoiceRows
        name={t('cancelReason.title')}
        choices={choices}
        onPick={(reason) => {
          if (what) track({ name: 'cancel_reason', screen: `cancel.${what}`, what, reason });
          closeReason();
        }}
      />
      <MainButton text={t('cancelReason.skip')} onClick={closeReason} />
    </FormSheet>
  );
}
