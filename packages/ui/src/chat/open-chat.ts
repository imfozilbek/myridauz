import { createContext, useContext } from 'react';

// Opens a chat over any screen (docs/122): «Javob yozish», «Qoʻngʻiroq» and «Javob berish» of the
// sheet. ring: the call starts at once; answer: the call that rings in it is taken at once. onTrip:
// the line of the trip in the chat opens the seat or the trip it is about (G77).
export type ChatMode = 'ring' | 'answer';
export type OpenChat = (key: string, mode?: ChatMode, onTrip?: () => void) => void;

export const OpenChatContext = createContext<OpenChat>(() => undefined);

export const useOpenChat = (): OpenChat => useContext(OpenChatContext);
