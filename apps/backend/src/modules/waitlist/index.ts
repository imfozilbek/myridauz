import { splitStart, VIA_PATTERN } from '@platform/contracts';
import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../../env';
import { wireChannelChanges, wireKnownPeople, type ChannelChange } from '../channels';
import { platformOf } from '../stats';
import { heardChange } from './application/ads';
import { refreshCards, tellOpened } from './application/bot-jobs';
import { adDeps, botJobDeps, personDeps, teamDeps } from './deps';
import { adRoutes } from './http/ad-routes';
import { personRoutes } from './http/person-routes';
import { teamRoutes } from './http/team-routes';
import { d1Ads } from './infrastructure/d1-ads';
// A Cron run tells or refreshes this many people at most: the rest in the next runs (docs/181).
const CRON_BATCH = 100;

// The questionnaire of the main bot (G83, docs/181); the team's list, opening and «gold» (docs/183);
// the switch and the ad links of «Boshqaruv» (docs/184).
export const waitlistModule = personRoutes(personDeps, (client) => (client ? platformOf(client) : null));
export const waitlistTeamModule = new Hono<AppEnv>()
  .route('/', teamRoutes(teamDeps))
  .route('/', adRoutes(adDeps));

// /start of the main bot: the first touch with its mark (docs/116); whether the list is open.
export async function mainStarted(env: Bindings, userId: number, payload: string): Promise<boolean> {
  const deps = botJobDeps(env);
  if (!deps) return true;
  const via = splitStart(payload).via ?? (VIA_PATTERN.test(payload) ? payload : null);
  await deps.visits.started(userId, via, deps.now());
  return (await deps.switches.read()).open;
}

// The Cron jobs (docs/181): the people of opened directions hear it; the Monday update of the cards.
export async function tellOpenedDirections(env: Bindings): Promise<void> {
  const deps = botJobDeps(env);
  if (deps) await tellOpened(deps, CRON_BATCH);
}
export async function refreshWaitlistCards(env: Bindings): Promise<void> {
  const deps = botJobDeps(env);
  if (deps) await refreshCards(deps, CRON_BATCH);
}

// The people of the list are known to the bot of the channels (docs/176); a join by an invite link of
// an ad counts for that ad (docs/184). Set here: the list depends on the channels, not back.
wireKnownPeople(async (env, userId) => ((await botJobDeps(env)?.records.of(userId)) ?? []).length > 0);
wireChannelChanges(async (env: Bindings, change: ChannelChange) => {
  if (env.DB) await heardChange(d1Ads(env.DB), change);
});
// «Maʼlumotlarimni oʻchirish» (docs/58): the records, the first touch and the joins by an ad go.
export const forgetWaitlist = async (env: Bindings, userId: number) =>
  botJobDeps(env)?.records.forget(userId);
