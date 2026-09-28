import type { Bindings } from '../../env';
import { adminIds } from '../../shared/telegram/bot-config';
import { members, roleOf, setModerator, type Team } from './application/team';
import { d1Team } from './infrastructure/d1-team';
import { createMemoryTeam } from './infrastructure/memory-team';

const localTeam = createMemoryTeam();

const teamOf = (env: Bindings): Team => ({
  owners: adminIds(env),
  repository: env.DB ? d1Team(env.DB) : localTeam,
});

// The team for the rest of the backend: auth, bots, moderation.
export const teamRole = (env: Bindings, userId: number) => roleOf(teamOf(env), userId);
export const teamMembers = (env: Bindings) => members(teamOf(env));
export const changeModerator = (env: Bindings, actorId: number, userId: number, isModerator: boolean) =>
  setModerator(teamOf(env), actorId, userId, isModerator, Date.now());
