import { Text } from '@telegram-apps/telegram-ui';
import { useLayoutEffect } from 'react';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { useAccount } from '../account-context';
import { useFaceShot } from './use-face-shot';

// A new face, as on screen 2 of the registration (G58, docs/118): only the front camera, never the
// gallery (owner, 17.10.2026); the team checks every photo. In the card of «Profil» it is a link of
// the brand color (G65, mockup g65/3). pick: the camera opens at once, still in the tap that opened
// the page (G79 П18).
export function AvatarPicker({
  link = false,
  pick = false,
}: {
  readonly link?: boolean;
  readonly pick?: boolean;
}) {
  const account = useAccount();
  const { t } = useI18n();
  const face = useFaceShot();
  const { take } = face;
  useLayoutEffect(() => {
    if (pick) take();
    // Only the tap that opened the page: a new render must not open the camera again.
  }, [pick]);
  if (!account) return null;
  // A passenger may go without a photo: the link says so (owner decision 19.10.2026, G51).
  const add = account.app === 'passenger' ? 'account.avatar.addOptional' : 'account.avatar.add';
  const label = t(account.profile.hasAvatar ? 'account.avatar.change' : add);
  return (
    <>
      {face.element}
      {link ? (
        <button type="button" className="profile-link" disabled={face.busy} onClick={take}>
          {label}
        </button>
      ) : (
        <Button mode="bezeled" size="m" loading={face.busy} onClick={take}>
          {label}
        </Button>
      )}
      {face.failure ? <Text className="step-error">{t(face.failure)}</Text> : null}
    </>
  );
}
