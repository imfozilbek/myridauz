import type { PersonId } from '@platform/contracts';
import { useBrand } from '../../context/brand-context';
import { Icon } from '../../icons';
import { useAvatarUrl } from './use-avatar-url';

type ProfilePhotoProps = {
  readonly userId: PersonId;
  readonly name: string;
  readonly hasAvatar: boolean;
  readonly size?: number;
  // The size comes from the style of the place: the head of the main screen (G76, docs/121).
  readonly fluid?: boolean;
};

// A round photo, or a person icon while there is none.
export function ProfilePhoto({ userId, name, hasAvatar, size = 112, fluid = false }: ProfilePhotoProps) {
  const url = useAvatarUrl(userId, hasAvatar);
  const { colors } = useBrand().theme;
  const style = fluid ? undefined : { width: size, height: size };
  if (url) return <img src={url} alt={name} style={style} className="profile-round" />;
  return (
    <span style={style} className="profile-round profile-empty">
      <Icon name="profile" size={Math.round(size / 2)} color={colors.textMuted} />
    </span>
  );
}
