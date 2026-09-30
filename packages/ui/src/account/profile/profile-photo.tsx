import type { PersonId } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { Icon } from '../../icons';
import { useAvatarUrl } from './use-avatar-url';

type ProfilePhotoProps = {
  readonly userId: PersonId;
  readonly name: string;
  readonly hasAvatar: boolean;
  readonly size?: number;
};

// A round photo, or a person icon while there is none.
export function ProfilePhoto({ userId, name, hasAvatar, size = 112 }: ProfilePhotoProps) {
  const url = useAvatarUrl(userId, hasAvatar);
  const { colors } = useBrand().theme;
  const style = { width: size, height: size };
  if (url) return <img src={url} alt={name} style={style} className="profile-round" />;
  return (
    <span style={style} className="profile-round profile-empty">
      <Icon name="profile" size={Math.round(size / 2)} color={colors.textMuted} />
    </span>
  );
}
