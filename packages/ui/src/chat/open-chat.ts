import { createContext, useContext } from 'react';

// Opens a chat over any screen (docs/122): «Javob yozish» and «Javob berish» of the sheet. answer:
// the call that rings in it is taken at once.
export type OpenChat = (key: string, answer?: boolean) => void;

export const OpenChatContext = createContext<OpenChat>(() => undefined);

export const useOpenChat = (): OpenChat => useContext(OpenChatContext);
