import './team.css';
import './navbat.css';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import type { HomeGo } from '../flow/start-action';
import { Icon } from '../icons';
import { useLoad } from '../market/use-list';
import { ActionFailure } from '../states/action-failure';
import { ErrorScreen } from '../states/error-screen';
import { haptic } from '../telegram/feedback';
import { brandVars } from '../theme/brand-vars';
import { DiqqatSection } from './diqqat-section';
import { NavbatSection } from './navbat-section';
import { TeamProfile } from './team-profile';
import { ManageGroup, ManageRow } from '../manage/manage-page';
import { ADS_SECTION, CHANNELS_SECTION, MANAGEMENT_SECTION, STATS_SECTION } from './team-sections';
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
  const { value: me, failed, reload } = useLoad(() => moderation.me(), 'home.me');
  const queue = useLoad(() => team.navbat(), 'team.navbat');
  const navbat = queue.value;
  // Who the person is or «Navbat» did not come: the error with «Qayta urinish», never an empty
  // screen (G77, G90 ADM-10).
  if (failed || (queue.failed && !navbat)) return <ErrorScreen onRetry={() => (reload(), queue.reload())} />;
  if (!me) return null;
  const owner = me.role === 'owner';
  return (
    <div className="team-home" style={brandVars(colors)}>
      <TeamProfile me={me} />
      {owner ? <OwnerDiqqat go={go} /> : null}
      {navbat ? (
        <NavbatSection navbat={navbat} shown={owner ? OWNER_SHOWN : MODERATOR_SHOWN} go={go} />
      ) : null}
      {owner ? <ManagementRow go={go} /> : <ModeratorNumbers go={go} />}
    </div>
  );
}

// Only the owner reads «Diqqat»: a moderator never asks for it.
function OwnerDiqqat({ go }: GoProps) {
  const { team } = useApiClients();
  const { value: attention, failed } = useLoad(() => team.attention(), 'team.attention');
  if (attention) return <DiqqatSection attention={attention} go={go} />;
  // «Diqqat» that did not load says so, never vanishes (G90 ADM-10).
  return failed ? <ActionFailure error="errors.generic.description" /> : null;
}

// The own numbers of the day, then «Statistika» and «Kanallar» to read only (owner decision
// 06.10.2026, docs/120): a moderator changes nothing there, the server refuses it too. The links of
// the ads a moderator makes and reads (owner, 17.10.2026, docs/184).
function ModeratorNumbers({ go }: GoProps) {
  const { t } = useI18n();
  const brand = useBrand();
  const { team } = useApiClients();
  const { value: work, failed } = useLoad(() => team.work(), 'team.work');
  return (
    <>
      {work ? <WorkNumbers work={work} /> : null}
      {!work && failed ? <ActionFailure error="errors.generic.description" /> : null}
      <ManageGroup title={brand.name}>
        <ManageRow
          icon="statistics"
          title={t('common.admin.statistics')}
          hint={t('manage.statisticsHint')}
          onClick={() => go(STATS_SECTION)}
        />
        <ManageRow icon="channel" title={t('channels.title')} onClick={() => go(CHANNELS_SECTION)} />
        <ManageRow icon="adLink" title={t('ads.title')} onClick={() => go(ADS_SECTION)} />
      </ManageGroup>
    </>
  );
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
