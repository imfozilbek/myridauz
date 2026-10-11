import { openInTelegram } from './feedback';

// Opens a Mini App of the brand by its bot (docs/02): the app of drivers from «Haydovchi boʻling»,
// the app itself from «Telegramda oching».
export const openApp = (bot: string) => openInTelegram(`https://t.me/${bot}?startapp`);
