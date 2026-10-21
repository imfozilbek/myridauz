import { MINUTE_MS, tashkentDate, teamWaitMs } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { caseName, showQueue, tellOwners, waitingCases } from '../team-queue';
import { peopleOf } from '../users';
import { remindCases, type WaitingCase } from './application/remind-cases';
import { activeTeam, storeOf } from './team-of';

const { t } = createI18n(DEFAULT_LOCALE);

// The Cron job (owner decision 20.10.2026, G89 A5): complaints, photos and support questions ring as
// applications do (G34): «⏱ … kutmoqda» under «Navbat» of its member or the whole team, then a line of
// «Diqqat» with a ring for the owners.
export function sendCaseReminders(env: Bindings) {
  const { hours, remindMinutes, ownerMinutes } = brandOf(env).moderation;
  const store = storeOf(env);
  const people = peopleOf(env);
  return remindCases({
    rules: { hours, remindMinutes, ownerMinutes },
    now: Date.now,
    cases: async () =>
      (await waitingCases(env)).flatMap(({ kind, id, name, since, sides }): WaitingCase[] =>
        kind === 'application' ? [] : [{ kind, id, name, since, ...(sides ? { sides } : {}) }],
      ),
    // A support question is of the member it was given to on its day (docs/92).
    assigneeOf: async (item) => {
      if (item.kind !== 'support') return undefined;
      const userId = await people.idOf(item.id);
      return userId === undefined ? undefined : store.assigneeOf('support', userId, tashkentDate(item.since));
    },
    teamIds: () => activeTeam(env),
    mark: (item, step, at) => store.markCase(item.kind, item.id, item.since, step, at),
    toMembers: async (memberIds, item) => {
      const minutes = Math.floor(teamWaitMs(item.since, Date.now(), hours) / MINUTE_MS);
      const left = String(Math.max(0, ownerMinutes - minutes));
      const text = t('bot.navbat.ringLate', { case: caseName(item), minutes: String(minutes), left });
      await showQueue(env, { kind: 'late', memberIds, text });
    },
    toOwners: async (item, moderatorId) => {
      const moderator = moderatorId === undefined ? '' : ((await people.find(moderatorId))?.firstName ?? '');
      const values = { case: caseName(item), minutes: String(ownerMinutes), moderator };
      const text = t(moderator ? 'bot.navbat.ownerLate' : 'bot.navbat.ownerLateAll', values);
      const sign = { kind: 'late' as const, name: item.name, moderator, minutes: ownerMinutes };
      await tellOwners(env, { id: `late:${item.kind}:${item.id}`, text, ring: true, sign });
    },
  });
}
