import './help.css';
import type { HelpTopic } from '@platform/contracts';
import { currentScreen, useAnalytics } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { useHomeGo } from '../flow/home-context';
import { Icon } from '../icons';
import { useHelpValues } from './help-parts';

// «Yordam» among the sections of the main screen (G97, docs/226).
export const HELP_SECTION = 'help';
const ICON = 16;

// «Hamyon va komissiya boʻyicha savollar» under a screen a person may get stuck on (T6 of G97): it
// opens «Yordam» on that topic. A screen outside the main screen passes its own way to open it.
export function HelpLink({ topic, onOpen }: { readonly topic: HelpTopic; readonly onOpen?: () => void }) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const go = useHomeGo();
  const values = useHelpValues();
  const show = onOpen ?? (go ? () => go(HELP_SECTION, { help: topic }) : null);
  if (!show) return null;
  const open = () => {
    track({ name: 'help_open', screen: currentScreen(), code: topic });
    show();
  };
  return (
    <button type="button" className="help-link" onClick={open}>
      <Icon name="help" size={ICON} />
      {t('help.link', { topic: t(`help.topic.${topic}`, values) })}
    </button>
  );
}
