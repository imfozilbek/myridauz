import { useCallsOn } from '../../call/calls-on';
import { useI18n } from '../../context/i18n-context';
import { SecondaryButton } from '../../telegram/bottom-button';

// «Qoʻngʻiroq» under a card of the block: none while calls are not set up, as beside the person
// (G52, G91 PAS-12).
export function CallButton({ onClick }: { readonly onClick: () => void }) {
  const { t } = useI18n();
  return useCallsOn() ? <SecondaryButton beside text={t('sheet.meet.call')} onClick={onClick} /> : null;
}
