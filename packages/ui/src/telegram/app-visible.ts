import { on } from '@telegram-apps/sdk-react';

// The person came back to the Mini App: the browser tab shows again, or Telegram made the app
// active again (docs/64). Screens refresh then, even if a live signal was missed.
export function onAppVisible(listener: () => void): () => void {
  const onVisibility = () => document.visibilityState === 'visible' && listener();
  document.addEventListener('visibilitychange', onVisibility);
  const stopTelegram = on('visibility_changed', ({ is_visible }) => is_visible && listener());
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    stopTelegram();
  };
}
