// Where the Bot API lives: Telegram, or the stub of the local stand (docs/75). The Worker sets it
// from TELEGRAM_API_URL at every entry; production leaves it unset and talks to Telegram.
const TELEGRAM = 'https://api.telegram.org';
let base = TELEGRAM;

export const useTelegramApi = (url: string | undefined): void => {
  base = url ?? TELEGRAM;
};

export const telegramUrl = (token: string, method: string): string => `${base}/bot${token}/${method}`;

// A file a bot received (a voice message): only that bot's token opens it.
export const telegramFileUrl = (token: string, path: string): string => `${base}/file/bot${token}/${path}`;
