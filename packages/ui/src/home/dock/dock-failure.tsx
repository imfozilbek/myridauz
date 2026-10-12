import type { TranslationKey } from '@platform/i18n';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { HomeRowCard } from '../home-card';
import './dock-card.css';

// A step of the block that did not work (docs/65 B3): the same red row as the lists that did not
// load (G78 sheet 6), the reason under it; the button of the step is tapped again.
export function DockFailure({ error }: { readonly error: TranslationKey | null }) {
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  if (!error) return null;
  return (
    <div role="alert" className="dock-failure">
      <HomeRowCard icon="error" color={colors.danger} title={t('errors.generic.title')} hint={t(error)} />
    </div>
  );
}
