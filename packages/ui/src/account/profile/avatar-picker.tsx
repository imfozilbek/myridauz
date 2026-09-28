import { Text } from '@telegram-apps/telegram-ui';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components';
import { useI18n } from '../../context/i18n-context';
import { haptic } from '../../telegram/feedback';
import { useHasCamera } from '../../telegram/in-telegram-context';
import { useAccount } from '../account-context';
import { compressImage } from './compress-image';

// The photo is a selfie with the front camera only (owner decision, docs/47): no gallery.
// Telegram Desktop and Web have no camera, so there the person is sent to the phone.
export function AvatarPicker() {
  const account = useAccount();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasCamera = useHasCamera();
  if (!account) return null;
  if (!hasCamera) return <Text className="step-hint">{t('account.avatar.phoneOnly')}</Text>;
  const { client, profile, onAvatarChanged } = account;

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
        capture="user"
        onChange={(event) => void upload(event)}
      />
      <Button mode="bezeled" size="m" loading={busy} onClick={() => input.current?.click()}>
        {t(profile.hasAvatar ? 'account.avatar.change' : 'account.avatar.add')}
      </Button>
      {failed ? <Text className="step-error">{t('account.avatar.failed')}</Text> : null}
    </>
  );
}
