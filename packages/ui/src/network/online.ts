import { useSyncExternalStore } from 'react';

// Whether the phone has a network, as the browser knows it (G43).
const subscribe = (changed: () => void) => {
  window.addEventListener('online', changed);
  window.addEventListener('offline', changed);
  return () => {
    window.removeEventListener('online', changed);
    window.removeEventListener('offline', changed);
  };
};

export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine);
