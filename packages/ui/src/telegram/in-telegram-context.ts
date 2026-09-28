import { createContext, useContext } from 'react';

// iOS and Android look differ in Telegram; TelegramUI adapts to the platform (docs/19).
type Platform = 'ios' | 'base';
export type TelegramSession = {
  readonly inTelegram: boolean;
  readonly platform: Platform;
  // Signed launch data: every API call carries it (docs/32). Empty outside Telegram.
  readonly initData: string;
  // Phones have a front camera; Telegram Desktop and Web do not (profile photo, docs/47).
  readonly hasCamera: boolean;
};

export const OUTSIDE_TELEGRAM: TelegramSession = {
  inTelegram: false,
  platform: 'base',
  initData: '',
  hasCamera: true,
};
export const TelegramContext = createContext<TelegramSession>(OUTSIDE_TELEGRAM);

export const useInTelegram = () => useContext(TelegramContext).inTelegram;
export const usePlatform = () => useContext(TelegramContext).platform;
export const useHasCamera = () => useContext(TelegramContext).hasCamera;
