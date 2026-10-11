import type { AppLink } from '@platform/contracts';
import { createContext, useContext } from 'react';

// Opens a booking, a trip or a request in «Mening safarlarim» over the whole app, as a bot link does
// (G77): a chat over the app has no section of its own to open a seat in. «Назад» goes home.
export const AppLinkContext = createContext<((link: AppLink) => void) | null>(null);

// What a chat opens: the opener's own way, else over the app; none outside the launch links.
export function useLinkOpener(own: ((link: AppLink) => void) | undefined) {
  const shared = useContext(AppLinkContext);
  return own ?? shared ?? undefined;
}
