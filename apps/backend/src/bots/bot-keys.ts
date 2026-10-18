import type { Bindings } from '../env';
import { recordServerEvent } from '../modules/analytics';
import { botToken } from '../shared/telegram/bot-config';
import { BOTS } from './configure-bots';

const POSTER = 'poster';
const NO_KEY = 'no_key';

// The bots without their key in the Worker; the bot of the channels only while the posts are on.
export const missingBotKeys = (env: Bindings): string[] => [
  ...BOTS.filter((bot) => !botToken(env, bot)),
  ...(env.CHANNEL_POSTS === 'on' && !env.POSTER_BOT_TOKEN ? [POSTER] : []),
];

// A bot without its key answers nobody and posts nothing, without a word (lesson 331): the hourly
// Cron shows each missing key in «Statistika» as a server error of that bot (owner, 18.10.2026).
export function showMissingBotKeys(env: Bindings): void {
  for (const bot of missingBotKeys(env)) {
    recordServerEvent(env, { name: 'server_error', source: bot, code: NO_KEY });
  }
}
