import { Text } from '@telegram-apps/telegram-ui';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';
import { useAccount } from '../account-context';
import { compressImage } from './compress-image';

// A driver takes the photo with the front camera (docs/05). Telegram WebView honours "capture"
// on phones; Telegram Desktop has no camera and opens a file picker (docs/47).
export function AvatarPicker() {
  const account = useAccount();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!account) return null;
  const { client, app, profile, onAvatarChanged } = account;

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      await client.uploadAvatar(await compressImage(file));
      haptic.success();
      onAvatarChanged();
    } catch {
      haptic.error();
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={input}
        className="file-input"
        type="file"
        accept="image/*"
        capture={app === 'driver' ? 'user' : undefined}
        onChange={(event) => void upload(event)}
      />
      <Button mode="bezeled" size="m" loading={busy} onClick={() => input.current?.click()}>
        {t(profile.hasAvatar ? 'account.avatar.change' : 'account.avatar.add')}
      </Button>
      {failed ? <Text className="step-error">{t('account.avatar.failed')}</Text> : null}
    </>
  );
}
