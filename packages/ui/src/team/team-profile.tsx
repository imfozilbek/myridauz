import type { TeamMe } from '@platform/contracts';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { useBlobUrl } from '../media/use-blob-url';

const FACE = 44;
const EMPTY_ICON = 22;

// Who works here: the photo, the name and the role on a white card (mockup g67/1). The team has no
// profile screen in the admin app, so the card does not open anything.
export function TeamProfile({ me }: { readonly me: TeamMe }) {
  const { t } = useI18n();
  const { team } = useApiClients();
  const { id } = me;
  const load = id !== null && me.hasAvatar ? () => team.avatar(id) : null;
  const url = useBlobUrl(load, `team:${id}`, true);
  const size = { width: FACE, height: FACE };
  return (
    <div className="team-card team-profile">
      {url ? (
        <img src={url} alt={me.firstName} style={size} className="profile-round" />
      ) : (
        <span className="profile-round profile-empty" style={size}>
          <Icon name="profile" size={EMPTY_ICON} />
        </span>
      )}
      <span className="navbat-words">
        <span className="team-profile-name">{me.firstName}</span>
        <span className="team-profile-role">{t(`home.role.${me.role}`)}</span>
      </span>
    </div>
  );
}
