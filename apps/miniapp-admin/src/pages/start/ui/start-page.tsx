import { t } from '@platform/i18n';
import { ShieldCheck, StartScreen, useBrand } from '@platform/ui';

export function StartPage() {
  const brand = useBrand();
  return <StartScreen icon={ShieldCheck} description={t('start.admin', { brand: brand.name })} />;
}
