import { t } from '@platform/i18n';
import { Search, StartScreen } from '@platform/ui';

export function StartPage() {
  return <StartScreen icon={Search} description={t('start.passenger')} />;
}
