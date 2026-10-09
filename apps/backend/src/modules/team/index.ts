import type { Bindings } from '../../env';
import { adminIds } from '../../shared/telegram/bot-config';
import { members, roleOf, setModerator, type Team } from './application/team';
import { d1Team } from './infrastructure/d1-team';
import { createMemoryTeam } from './infrastructure/memory-team';
import { recordAction } from '../journal';
import { peopleOf } from '../users';

const localTeam = createMemoryTeam();

const teamOf = (env: Bindings): Team => ({
  owners: adminIds(env),
  repository: env.DB ? d1Team(env.DB) : localTeam,
});

// The team for the rest of the backend: auth, bots, moderation.
export const teamRole = (env: Bindings, userId: number) => roleOf(teamOf(env), userId);
export const teamMembers = (env: Bindings) => members(teamOf(env));
// A change of the team goes to the journal by the public id (G75, docs/65 A3).
export async function changeModerator(env: Bindings, actorId: number, userId: number, isModerator: boolean) {
  const result = await setModerator(teamOf(env), actorId, userId, isModerator, Date.now());
  if (result !== 'ok') return result;
  const subject = (await peopleOf(env).find(userId))?.publicId ?? '';
  const action = isModerator ? 'add' : 'remove';
  await recordAction(env, { memberId: actorId, kind: 'team', subject, action, since: null });
  return result;
}
