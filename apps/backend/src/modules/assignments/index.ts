import { appHost, loadBrand } from '@platform/brands';
import { MINUTE_MS, teamWaitMs } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { adminIds } from '../../shared/telegram/bot-config';
import { notify } from '../notifications';
import { teamMembers } from '../team';
import { caseName, showQueue, tellOwners } from '../team-queue';
import { peopleOf } from '../users';
import { assign } from './application/assign';
import { steadyOperator } from './domain/operator';
import { sendDigest, type DigestDeps } from './application/digest';
import type { Kind } from './application/ports';
import { remindWaiting, type Waiting } from './application/remind';
import { d1Assignments } from './infrastructure/d1-assignments';
import { digestText } from './infrastructure/digest-text';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

const { t } = createI18n(DEFAULT_LOCALE);
const localAssignments = createMemoryAssignments();
type Sources = Pick<DigestDeps, 'decisions' | 'numbers'>;
const NO_SOURCES: Sources = {
  decisions: async () => new Map(),
  numbers: async () => ({ newUsers: 0, trips: 0, bookings: 0, fromChannels: 0 }),
};
const storeOf = (env: Bindings) => (env.DB ? d1Assignments(env.DB) : localAssignments);

const deps = (env: Bindings, sources: Sources = NO_SOURCES): DigestDeps => ({
  store: storeOf(env),
  teamIds: async () => (await teamMembers(env)).map((member) => member.id),
  now: Date.now,
  random: Math.random,
  ...sources,
  // The owner hears the summary without sound, with the dashboard a tap away (docs/122).
  send: async (day, rows, numbers) => {
    const people = peopleOf(env);
    const names = new Map(
      await Promise.all(
        rows.map(async (row) => [row.memberId, (await people.find(row.memberId))?.firstName] as const),
      ),
    );
    const text = digestText(day, rows, numbers, (id) => names.get(id) ?? String(id));
    const url = `https://${appHost(loadBrand(env.BRAND), 'admin')}/?stats=day`;
    const markup = { inline_keyboard: [[{ text: t('bot.summary.open'), web_app: { url } }]] };
    const job = (chatId: number) => ({
      bot: 'admin' as const,
      chatId,
      text,
      html: true,
      silent: true,
      markup,
    });
    await notify(env, [...adminIds(env)].map(job));
  },
});

// The one team member for a question of the support bot or a driver application (docs/92).
export const assignTo = async (env: Bindings, kind: Kind, subjectId: number): Promise<number[]> => {
  const assignee = await assign(deps(env), kind, subjectId);
  return assignee === undefined ? [] : [assignee];
};
// A team member answered the question of this person.
export const markAnswered = (env: Bindings, subjectId: number) =>
  deps(env).store.answered('support', subjectId, Date.now());
// «Operator N» for the answers to this person (docs/92): the number of the latest question.
export const operatorOf = async (env: Bindings, subjectId: number): Promise<number> =>
  (await deps(env).store.operatorOf('support', subjectId)) ?? steadyOperator(subjectId);
// The Cron job: the summary of the day to the owner at 21:00 in Tashkent, once (G68, docs/122).
export const sendDaySummary = (env: Bindings, sources: Sources) => sendDigest(deps(env, sources));

// The Cron job (G34): a waiting application reminds its moderator, then the owners, in team hours.
export function sendApplicationReminders(env: Bindings, waiting: () => Promise<Waiting[]>) {
  const brand = loadBrand(env.BRAND);
  const { hours, remindMinutes, ownerMinutes } = brand.moderation;
  return remindWaiting({
    store: storeOf(env),
    rules: { hours, remindMinutes, ownerMinutes },
    now: Date.now,
    waiting,
    // «⏱ Jasur arizasi 25 daqiqa kutmoqda: 5 daqiqa qoldi» under the «Navbat» card (G68, docs/122).
    toModerator: async (moderatorId, { name, submittedAt }) => {
      const minutes = Math.floor(teamWaitMs(submittedAt, Date.now(), hours) / MINUTE_MS);
      const text = t('bot.navbat.ringLate', {
        case: caseName({ kind: 'application', name, since: submittedAt }),
        minutes: String(minutes),
        left: String(Math.max(0, ownerMinutes - minutes)),
      });
      await showQueue(env, { kind: 'late', memberId: moderatorId, text });
    },
    // A case over the limit rings under «Diqqat» of the owners (G68, docs/122).
    toOwners: async ({ name, publicId }, moderatorId) => {
      const moderator = (await peopleOf(env).find(moderatorId))?.firstName ?? String(moderatorId);
      const text = t('bot.moderation.ownerWaiting', { minutes: String(ownerMinutes), name, moderator });
      const sign = { kind: 'late' as const, name, moderator, minutes: ownerMinutes };
      await tellOwners(env, { id: `late:${publicId}`, text, ring: true, sign });
    },
  });
}
