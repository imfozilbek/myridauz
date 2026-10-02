import { addToHomeScreen, checkHomeScreenStatus } from '@telegram-apps/sdk-react';
import { useEffect, useState } from 'react';

// The icon of the app on the phone's screen (docs/88 L17): offered only when Telegram can add it
// and it is not there yet. Outside Telegram nothing is offered.
export function useCanAddToHomeScreen(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    let alive = true;
    void checkHomeScreenStatus
      .ifAvailable()?.[1]
      ?.then((status) => {
        if (alive) setCan(status === 'missed');
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return can;
}

export function addAppToHomeScreen() {
  addToHomeScreen.ifAvailable();
}
