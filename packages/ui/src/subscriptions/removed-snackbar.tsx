import type { Subscription } from '@platform/contracts';
import { Snackbar } from '../components';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';

type Props = {
  readonly removed: Subscription;
  readonly onClose: () => void;
  readonly onRestored: () => void;
  readonly onFailed: (caught: unknown) => void;
};

// «Obuna oʻchirildi» for a few seconds, and «Qaytarish» brings it back by one tap (docs/88 L7).
export function RemovedSnackbar({ removed, onClose, onRestored, onFailed }: Props) {
  const { t } = useI18n();
  const { subscriptions } = useApiClients();
  const undo = async () => {
    onClose();
    const { from, to, date, woman } = removed;
    await subscriptions.subscribe({ from, to, date, woman }).catch(onFailed);
    onRestored();
  };
  return (
    <Snackbar
      onClose={onClose}
      after={<Snackbar.Button onClick={() => void undo()}>{t('common.undo')}</Snackbar.Button>}
    >
      {t('subscriptions.removed')}
    </Snackbar>
  );
}
