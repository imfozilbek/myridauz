import { createContext, useContext } from 'react';

// iOS and Android look differ in Telegram; TelegramUI adapts to the platform (docs/19).
type Platform = 'ios' | 'base';
export type TelegramSession = { readonly inTelegram: boolean; readonly platform: Platform };

export const OUTSIDE_TELEGRAM: TelegramSession = { inTelegram: false, platform: 'base' };
export const TelegramContext = createContext<TelegramSession>(OUTSIDE_TELEGRAM);

export const useInTelegram = () => useContext(TelegramContext).inTelegram;
export const usePlatform = () => useContext(TelegramContext).platform;
