import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { markAnswered, operatorOf } from '../assignments';
import { recordSupport, supportDeps, supportTalk, tellAnswered } from '../support';
import { blockOf, peopleOf } from '../users';
import { supportRoutes } from './http/support-routes';

const { t } = createI18n(DEFAULT_LOCALE);

// A question of support as a case of «Navbat» (G75, docs/158 К): the talk of the support module,
// «Operator N» of the assignments, the person and the block of the users module.
export const supportCaseModule = supportRoutes((env) => ({
  person: async (publicId) => {
    const people = peopleOf(env);
    const id = await people.idOf(publicId);
    const person = id === undefined ? undefined : await people.find(id);
    return person && { id: person.id, name: person.firstName };
  },
  blocked: async (id) => (await blockOf(env, id)) !== null,
  talk: (id) => supportTalk(env, id),
  operator: (id) => operatorOf(env, id),
  send: async (id, operator, text) => {
    const content = { text: t('bot.support.answer', { operator: String(operator), text }) };
    const sent = await supportDeps(env, fetch).toWriter('support', id, content);
    return sent !== undefined;
  },
  record: (entry) => recordSupport(env, entry),
  answered: async (id, member) => {
    await markAnswered(env, id);
    await tellAnswered(env, id, member.id, member.name);
  },
  operatorName: (operator) => t('bot.support.operator', { operator: String(operator) }),
  now: Date.now,
}));
