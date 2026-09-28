import { t } from '@platform/i18n';
import { CarFront, StartScreen } from '@platform/ui';

export function StartPage() {
  return <StartScreen icon={CarFront} description={t('start.driver')} />;
}
