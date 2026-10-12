import type { PersonId } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';
import { useBrand } from '../context/brand-context';
import { Icon, type IconName } from '../icons';
import './person-badge.css';

// The icon's share of the face (sheet 7-edits-1).
const ICON = 0.56;

// Who the face is: the passenger and the driver each have their own icon and color.
export type FaceRole = 'passenger' | 'driver';
const ICONS: Record<FaceRole, IconName> = { passenger: 'profile', driver: 'car' };

type Props = {
  readonly id: PersonId;
  readonly name: string;
  readonly hasAvatar: boolean;
  readonly size: number;
  readonly role: FaceRole;
};

// A small round face, or the icon of the role on its color while there is no photo: never a letter,
// never an emoji (owner decision 12.10.2026, docs/172).
export function PersonBadge({ id, name, hasAvatar, size, role }: Props) {
  const { colors } = useBrand().theme;
  if (hasAvatar) return <ProfilePhoto userId={id} name={name} hasAvatar size={size} />;
  const driver = role === 'driver';
  return (
    <span
      className="person-badge"
      style={{
        width: size,
        height: size,
        background: driver ? colors.faceDriver : colors.facePassenger,
        color: driver ? colors.faceDriverIcon : colors.facePassengerIcon,
      }}
      aria-hidden
    >
      <Icon name={ICONS[role]} size={Math.round(size * ICON)} />
    </span>
  );
}
