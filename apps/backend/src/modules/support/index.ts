import { DAY_MS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { botToken } from '../../shared/telegram/bot-config';
import { sendMedia } from '../../shared/telegram/telegram-files';
import { sendText, type Fetch } from '../../shared/telegram/telegram-api';
import { notify } from '../notifications';
import { teamMembers } from '../team';
import type { Content, SupportDeps } from './application/support';
import { d1SupportLinks } from './infrastructure/d1-support-links';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';
import { KEEP_MS, type HistoryEntry } from './application/history';
import { d1History } from './infrastructure/d1-history';
import { createMemoryHistory } from './infrastructure/memory-history';

const { t } = createI18n(DEFAULT_LOCALE);
// The copies of the last two days still wait for an answer of somebody (G68).
const COPIES_MS = 2 * DAY_MS;
const localLinks = createMemorySupportLinks();
const linksOf = (env: Bindings) => (env.DB ? d1SupportLinks(env.DB) : localLinks);
const localHistory = createMemoryHistory();
const historyOf = (env: Bindings) => (env.DB ? d1History(env.DB) : localHistory);

const sender = (fetch: Fetch, token: string | undefined) => async (chatId: number, content: Content) => {
  if (!token) return undefined;
  const { text, media, markup, html, quiet } = content;
  const options = { ...(html ? { html } : {}), ...(quiet ? { quiet } : {}) };
  return media
    ? sendMedia(fetch, token, chatId, media, text, markup, options)
    : sendText(fetch, token, chatId, text, markup, options);
};

export const supportDeps = (env: Bindings, fetch: Fetch): SupportDeps => ({
  links: linksOf(env),
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

// After an answer the other members with a copy of the person learn it, without sound, under their
// copy: «✅ Operator Aziz javob berdi» (G68, docs/122, mockup g68/4).
export async function tellAnswered(env: Bindings, personChatId: number, memberId: number, name: string) {
  const copies = await linksOf(env).copies(personChatId, Date.now() - COPIES_MS);
  const text = t('bot.supportCard.answered', { name });
  const jobs = copies
    .filter((copy) => copy.teamChatId !== memberId)
    .map((copy) => ({
      bot: 'admin' as const,
      chatId: copy.teamChatId,
      text,
      silent: true,
      replyTo: copy.teamMessageId,
    }));
  if (jobs.length > 0) await notify(env, jobs);
}
