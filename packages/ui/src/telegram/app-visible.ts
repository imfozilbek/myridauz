import { on } from '@telegram-apps/sdk-react';

// The person came back to the Mini App: the browser tab shows again, Telegram made the app active
// again (docs/64), or the network came back (G43). Screens refresh then, even if a signal was missed.
export function onAppVisible(listener: () => void): () => void {
  const onVisibility = () => document.visibilityState === 'visible' && listener();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', listener);
  const stopTelegram = on('visibility_changed', ({ is_visible }) => is_visible && listener());
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', listener);
    stopTelegram();
  };
}
