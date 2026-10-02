import type { Bindings } from '../../env';
import { botToken } from '../../shared/telegram/bot-config';
import { sendVoice } from '../../shared/telegram/telegram-files';
import { sendText, type Fetch } from '../../shared/telegram/telegram-api';
import { teamMembers } from '../team';
import type { Content, SupportDeps } from './application/support';
import { d1SupportLinks } from './infrastructure/d1-support-links';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';

const localLinks = createMemorySupportLinks();

const sender = (fetch: Fetch, token: string | undefined) => async (chatId: number, content: Content) => {
  if (!token) return undefined;
  const { text, voice } = content;
  return voice ? sendVoice(fetch, token, chatId, voice, text) : sendText(fetch, token, chatId, text);
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
