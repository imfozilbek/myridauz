import type { MiniApp } from '@platform/contracts';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { StateScreen } from '../states/state-screen';
import { MainButton } from '../telegram/bottom-button';
import { openInTelegram } from '../telegram/feedback';

// The internal environment is for the team only (owner, 17.10.2026, docs/179): anyone else sees the
// way to the same Mini App of production, one button.
export function MovedScreen({ app }: { readonly app: MiniApp }) {
  useScreenView('moved');
  const { t } = useI18n();
  const goTo = useBrand().teamOnly;
  const open = () => (goTo ? openInTelegram(`https://t.me/${goTo[app]}`) : undefined);
  return (
    <StateScreen
      button={goTo ? <MainButton text={t('account.moved.button')} onClick={open} /> : null}
      icon="team"
      title={t('account.moved.title')}
      description={t('account.moved.text')}
    />
  );
}
