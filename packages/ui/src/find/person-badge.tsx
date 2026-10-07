import type { PersonId } from '@platform/contracts';
import { ProfilePhoto } from '../account/profile/profile-photo';

type Props = { readonly id: PersonId; readonly name: string; readonly hasAvatar: boolean; readonly size: number };

// A small round face, or the first letter on mint while there is no photo (the approved mockups).
export function PersonBadge({ id, name, hasAvatar, size }: Props) {
  if (hasAvatar) return <ProfilePhoto userId={id} name={name} hasAvatar size={size} />;
  return (
    <span className="person-badge" style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
