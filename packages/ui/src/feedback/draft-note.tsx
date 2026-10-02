import { Text } from '@telegram-apps/telegram-ui';
import { useI18n } from '../context/i18n-context';

// A form back from its draft says so: «Oldingi yozganingiz tiklandi.» (docs/94 F3).
export function DraftNote({ shown }: { readonly shown: boolean }) {
  const { t } = useI18n();
  return shown ? <Text className="step-hint">{t('common.draftRestored')}</Text> : null;
}
