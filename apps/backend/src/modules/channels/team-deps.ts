import type { Bindings } from '../../env';
import { placesOf } from '../locations';
import type { TeamChannelsDeps } from './application/team';
import { botIsAdmin } from './infrastructure/bot-admin';
import { createMemoryTeamChannels, d1TeamChannels } from './infrastructure/team-channels';
import { brandOf } from '../../shared/brand/brand-of';

const localTeam = createMemoryTeamChannels();

// The region channels of the brand and the channels the team added in the admin (docs/63).
export async function teamDeps(env: Bindings): Promise<TeamChannelsDeps> {
  const places = await placesOf(env);
  return {
    fixed: brandOf(env).channels,
    titleOf: (id) => places.get(id)?.name,
    store: env.DB ? d1TeamChannels(env.DB) : localTeam,
    botIsAdmin: botIsAdmin((input, init) => fetch(input, init), env.PASSENGER_BOT_TOKEN),
    now: () => Date.now(),
  };
}
