import './team.css';
import './navbat.css';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { haptic } from '../telegram/feedback';
import { brandVars } from '../theme/brand-vars';
import { DiqqatSection } from './diqqat-section';
import { NavbatSection } from './navbat-section';
import { TeamProfile } from './team-profile';
import { MANAGEMENT_SECTION } from './team-sections';
import { WorkNumbers } from './work-numbers';

const ICON = 20;
const ARROW = 18;
// The cases on the main screen: the owner has «Diqqat» and «Boshqaruv» there too (mockup g67/1).
const OWNER_SHOWN = 4;
const MODERATOR_SHOWN = 6;
type GoProps = { readonly go: HomeGo };

// The main screen of the team (G75, docs/120, mockup g67/1). The owner: «Diqqat», «Navbat» and
// «Boshqaruv». A moderator: «Navbat» and the own numbers of the day, nothing of the owner.
export function TeamHome({ go }: GoProps) {
  const { moderation, team } = useApiClients();
  const { colors } = useBrand().theme;
  const me = useLoad(() => moderation.me(), 'home.me').value;
  const navbat = useLoad(() => team.navbat(), 'team.navbat').value;
  if (!me) return null;
  const owner = me.role === 'owner';
  return (
    <div className="team-home" style={brandVars(colors)}>
      <TeamProfile me={me} />
      {owner ? <OwnerDiqqat go={go} /> : null}
      {navbat ? (
        <NavbatSection navbat={navbat} shown={owner ? OWNER_SHOWN : MODERATOR_SHOWN} go={go} />
      ) : null}
      {owner ? <ManagementRow go={go} /> : <ModeratorNumbers />}
    </div>
  );
}

// Only the owner reads «Diqqat»: a moderator never asks for it.
function OwnerDiqqat({ go }: GoProps) {
  const { team } = useApiClients();
  const attention = useLoad(() => team.attention(), 'team.attention').value;
  return attention ? <DiqqatSection attention={attention} go={go} /> : null;
}

function ModeratorNumbers() {
  const { team } = useApiClients();
  const work = useLoad(() => team.work(), 'team.work').value;
  return work ? <WorkNumbers work={work} /> : null;
}

// «Boshqaruv»: prices, wallets, people, the team and the rest of the owner (docs/120).
function ManagementRow({ go }: GoProps) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="team-card team-management"
      onClick={() => {
        haptic.tap();
        go(MANAGEMENT_SECTION);
      }}
    >
      <span className="navbat-icon">
        <Icon name="management" size={ICON} />
      </span>
      <span className="team-management-title">{t('common.admin.management')}</span>
      <Icon name="next" size={ARROW} />
    </button>
  );
}
