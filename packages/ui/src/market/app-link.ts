import type { AppLink } from '@platform/contracts';
import { createContext } from 'react';

// Opens a booking, a trip or a request in «Mening safarlarim» over the whole app, as a bot link does
// (G77): only for the chat over the app (chat/chat-link.tsx), which has no section of its own to open
// a seat in. A chat inside a screen opens it there, by its own way. «Назад» goes home.
export const AppLinkContext = createContext<((link: AppLink) => void) | null>(null);
