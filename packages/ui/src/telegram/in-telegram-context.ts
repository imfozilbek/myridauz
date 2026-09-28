import { createContext, useContext } from 'react';

export const InTelegramContext = createContext(false);

export const useInTelegram = () => useContext(InTelegramContext);
