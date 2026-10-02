import { settingsButton } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';
import { useInTelegram } from './in-telegram-context';

// «Sozlamalar» in the ⋮ menu of Telegram opens the profile: the native place of settings (docs/88 L16).
export function useSettingsButton(onClick: () => void) {
  const inTelegram = useInTelegram();
  useEffect(() => {
    if (!inTelegram) return undefined;
    settingsButton.mount.ifAvailable();
    settingsButton.show.ifAvailable();
    const off = settingsButton.onClick.ifAvailable(onClick);
    return () => {
      if (off?.[0]) off[1]();
      settingsButton.hide.ifAvailable();
    };
  }, [inTelegram, onClick]);
}
