import { helpValues, type HelpQuestion } from '@platform/contracts';
import type { ReactNode } from 'react';
import { ProfileGroup, ProfileRow } from '../account/profile/profile-row';
import { useAnalytics } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useOpenSupport } from '../telegram/support-link';
import { useScreenBackground } from '../telegram/screen-background';
import { brandVars } from '../theme/brand-vars';

// The numbers of the answers: the brand with the live «Cheklovlar» (G97, docs/226).
export function useHelpValues() {
  const { formatMoney } = useI18n();
  return helpValues(useBrand(), formatMoney);
}

// One page of «Yordam» in the look of «Profil» (G65): the title, a line under it, white groups.
export function HelpPage({
  title,
  lead,
  onBack,
  children,
}: {
  readonly title: string;
  readonly lead?: string;
  readonly onBack: () => void;
  readonly children: ReactNode;
}) {
  useScreenBackground();
  const { colors } = useBrand().theme;
  return (
    <div className="profile profile-page help" style={brandVars(colors)}>
      <Screen onBack={onBack} />
      <h1 className="help-title">{title}</h1>
      {lead ? <p className="help-lead">{lead}</p> : null}
      {children}
    </div>
  );
}

// «Boshqa savolim bor»: the support bot of the brand, as «Yordam» was before (docs/50); the
// analytics hear after which answer people still write (docs/29).
export function MoreRow({ after }: { readonly after?: HelpQuestion }) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const support = useOpenSupport();
  const values = useHelpValues();
  const open = () => {
    track({ name: 'help_more', screen: 'help', ...(after ? { code: after } : {}) });
    support();
  };
  return (
    <ProfileGroup>
      <ProfileRow icon="write" title={t('help.more')} hint={t('help.moreHint', values)} onClick={open} />
    </ProfileGroup>
  );
}
