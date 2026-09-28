import { backButton } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';
import { Button } from '../components';
import { useI18n } from '../context/i18n-context';
import { useInTelegram } from './in-telegram-context';

// "Back" is the native button in the Telegram header (docs/21). Outside Telegram a plain button replaces it.
export function BackButton({ onClick }: { readonly onClick: () => void }) {
  const inTelegram = useInTelegram();
  const { t } = useI18n();
  useEffect(() => {
    if (!inTelegram) return undefined;
    backButton.show.ifAvailable();
    const off = backButton.onClick.ifAvailable(onClick);
    return () => {
      if (off?.[0]) off[1]();
      backButton.hide.ifAvailable();
    };
  }, [inTelegram, onClick]);
  if (inTelegram) return null;
  return (
    <Button mode="plain" size="s" onClick={onClick}>
      {t('common.back')}
    </Button>
  );
}
