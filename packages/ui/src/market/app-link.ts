import type { AppLink } from '@platform/contracts';
import { createContext } from 'react';

// Opens a booking, a trip or a request in «Mening safarlarim» over the whole app, as a bot link does
// (G77): for the chat over the app (chat/chat-link.tsx), which has no section of its own to open a
// seat in, and for «Joyimni ochish» of a trip while a seat elsewhere is held (docs/172). A chat
// inside a screen opens it there, by its own way. «Назад» goes home.
export const AppLinkContext = createContext<((link: AppLink) => void) | null>(null);
