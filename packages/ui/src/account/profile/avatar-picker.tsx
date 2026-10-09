import { Text } from '@telegram-apps/telegram-ui';
import { useRef, type ChangeEvent } from 'react';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { useAccount } from '../account-context';
import { useFaceUpload } from './use-face-shot';

// A new face from the camera or the gallery, as on screen 2 of the registration (G58, docs/118):
// it works on Telegram Desktop too, the team checks every photo. In the card of «Profil» it is a
// link of the brand color (G65, mockup g65/3).
export function AvatarPicker({ link = false }: { readonly link?: boolean }) {
  const account = useAccount();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const { upload, busy, failure } = useFaceUpload();
  if (!account) return null;
  const label = t(account.profile.hasAvatar ? 'account.avatar.change' : 'account.avatar.add');
  const picked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void upload(file);
  };
  return (
    <>
      <input ref={input} className="file-input" type="file" accept="image/*" onChange={picked} />
      {link ? (
        <button type="button" className="profile-link" disabled={busy} onClick={() => input.current?.click()}>
          {label}
        </button>
      ) : (
        <Button mode="bezeled" size="m" loading={busy} onClick={() => input.current?.click()}>
          {label}
        </Button>
      )}
      {failure ? <Text className="step-error">{t(failure)}</Text> : null}
    </>
  );
}
