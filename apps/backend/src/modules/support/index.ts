import type { Bindings } from '../../env';
import { sendText, type Fetch } from '../../shared/telegram/telegram-api';
import { teamMembers } from '../team';
import type { SupportDeps } from './application/support';
import { d1SupportLinks } from './infrastructure/d1-support-links';
import { createMemorySupportLinks } from './infrastructure/memory-support-links';

const localLinks = createMemorySupportLinks();

export const supportDeps = (env: Bindings, fetch: Fetch): SupportDeps => ({
  links: env.DB ? d1SupportLinks(env.DB) : localLinks,
  send: (chatId, text, markup) =>
    env.ADMIN_BOT_TOKEN
      ? sendText(fetch, env.ADMIN_BOT_TOKEN, chatId, text, markup)
      : Promise.resolve(undefined),
  teamIds: async () => (await teamMembers(env)).map((member) => member.id),
  now: Date.now,
});

export { answerPerson, forwardToTeam } from './application/support';
