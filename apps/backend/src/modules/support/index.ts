import type { Bindings } from '../../env';
import { botToken } from '../../shared/telegram/bot-config';
import { sendMedia } from '../../shared/telegram/telegram-files';
import { sendText, type Fetch } from '../../shared/telegram/telegram-api';
import { teamMembers } from '../team';
import type { Content, SupportDeps } from './application/support';
import { d1SupportLinks } from './infrastructure/d1-support-links';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';
import { KEEP_MS, type HistoryEntry } from './application/history';
import { d1History } from './infrastructure/d1-history';
import { createMemoryHistory } from './infrastructure/memory-history';

const localLinks = createMemorySupportLinks();
const localHistory = createMemoryHistory();
const historyOf = (env: Bindings) => (env.DB ? d1History(env.DB) : localHistory);

const sender = (fetch: Fetch, token: string | undefined) => async (chatId: number, content: Content) => {
  if (!token) return undefined;
  const { text, media, markup } = content;
  return media
    ? sendMedia(fetch, token, chatId, media, text, markup)
    : sendText(fetch, token, chatId, text, markup);
};

export const supportDeps = (env: Bindings, fetch: Fetch): SupportDeps => ({
  links: env.DB ? d1SupportLinks(env.DB) : localLinks,
  toTeam: sender(fetch, botToken(env, 'admin')),
  toWriter: (bot, chatId, content) => sender(fetch, botToken(env, bot))(chatId, content),
  teamIds: async () => (await teamMembers(env)).map((member) => member.id),
  now: Date.now,
});

export { answerPerson, forwardToTeam } from './application/support';
export type { Content } from './application/support';
export type { HistoryEntry } from './application/history';

// The support talk of a person (G32): kept, read by the team, erased with the account and after 90 days.
export const recordSupport = (env: Bindings, entry: HistoryEntry) => historyOf(env).add(entry);
export const supportTalk = (env: Bindings, personId: number) => historyOf(env).of(personId);
export const forgetSupport = (env: Bindings, personId: number) => historyOf(env).forget(personId);
export const purgeSupport = (env: Bindings, now: number) => historyOf(env).purge(now - KEEP_MS);
