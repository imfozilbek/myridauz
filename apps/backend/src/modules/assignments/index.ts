import type { Bindings } from '../../env';
import { notifyTeam } from '../notifications';
import { teamMembers } from '../team';
import { peopleOf } from '../users';
import { assign } from './application/assign';
import { sendDigest, type DigestDeps } from './application/digest';
import type { Kind } from './application/ports';
import { d1Assignments } from './infrastructure/d1-assignments';
import { digestText } from './infrastructure/digest-text';
import { createMemoryAssignments } from './infrastructure/memory-assignments';

const localAssignments = createMemoryAssignments();
type Decisions = DigestDeps['decisions'];

const deps = (env: Bindings, decisions: Decisions = async () => new Map()): DigestDeps => ({
  store: env.DB ? d1Assignments(env.DB) : localAssignments,
  teamIds: async () => (await teamMembers(env)).map((member) => member.id),
  now: Date.now,
  decisions,
  send: async (day, rows) => {
    const people = peopleOf(env);
    const names = new Map(
      await Promise.all(
        rows.map(async (row) => [row.memberId, (await people.find(row.memberId))?.firstName] as const),
      ),
    );
    await notifyTeam(
      env,
      digestText(day, rows, (id) => names.get(id) ?? String(id)),
    );
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
// The Cron job: the digest of the day before, once, after midnight in Tashkent.
export const sendTeamDigest = (env: Bindings, decisions: Decisions) => sendDigest(deps(env, decisions));
