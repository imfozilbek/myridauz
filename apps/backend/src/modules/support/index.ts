import type { Bindings } from '../../env';
import { botToken } from '../../shared/telegram/bot-config';
import { sendText, type Fetch } from '../../shared/telegram/telegram-api';
import { teamMembers } from '../team';
import type { SupportDeps } from './application/support';
import { d1SupportLinks } from './infrastructure/d1-support-links';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';

const localLinks = createMemorySupportLinks();

const sender =
  (fetch: Fetch, token: string | undefined) => (chatId: number, text: string, markup?: object) =>
    token ? sendText(fetch, token, chatId, text, markup) : Promise.resolve(undefined);

export const supportDeps = (env: Bindings, fetch: Fetch): SupportDeps => ({
  links: env.DB ? d1SupportLinks(env.DB) : localLinks,
  toTeam: sender(fetch, botToken(env, 'admin')),
  toWriter: (bot, chatId, text) => sender(fetch, botToken(env, bot))(chatId, text),
  teamIds: async () => (await teamMembers(env)).map((member) => member.id),
  now: Date.now,
});

export { answerPerson, forwardToTeam } from './application/support';
