import { createContext, useContext } from 'react';

// The app kept under a chat opened over it (ChatLink): it stays as it was, so «Назад» of the chat
// comes back to the very screen, the list or the section. While behind it gives away what Telegram
// shows: its buttons, «Назад», «Sozlamalar», its colors and its sheets.
export const Behind = createContext(false);

export const useBehind = (): boolean => useContext(Behind);
