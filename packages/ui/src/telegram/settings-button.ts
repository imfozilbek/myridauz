import { settingsButton } from '@telegram-apps/sdk-react';
import { useEffect } from 'react';
import { useBehind } from './behind';
import { useInTelegram } from './in-telegram-context';

// «Sozlamalar» in the ⋮ menu of Telegram opens the profile: the native place of settings (docs/88 L16).
// Only the main screen holds it: it hides when that screen goes (docs/94 F4). null: no profile to
// open (the admin app), so no button (G75, docs/159).
export function useSettingsButton(onClick: (() => void) | null) {
  const inTelegram = useInTelegram();
  const behind = useBehind();
  useEffect(() => {
    if (!inTelegram || behind || !onClick) return undefined;
    settingsButton.mount.ifAvailable();
    settingsButton.show.ifAvailable();
    const off = settingsButton.onClick.ifAvailable(onClick);
    return () => {
      if (off?.[0]) off[1]();
      settingsButton.hide.ifAvailable();
    };
  }, [inTelegram, behind, onClick]);
}
