import { attentionSignSchema, isTeamTime, tashkentDate } from '@platform/contracts';
import type { Bindings } from '../../env';
import { adminIds } from '../../shared/telegram/bot-config';
import { showCards, showNews, type Ring } from '../notifications';
import { teamMembers } from '../team';
import { peopleOf } from '../users';
import type { SignStore } from './application/attention';
import { createMemorySigns, d1Signs } from './infrastructure/d1-attention';
import { createMemoryTakes, d1Takes } from './infrastructure/d1-takes';
import { navbatRoutes } from './http/navbat-routes';
import { workRoutes } from './http/work-routes';
import { diqqatNews, type Signal } from './infrastructure/diqqat-card';
import { attentionRoutes } from './http/attention-routes';
import { queueOf, teamWork, workOf, type Case } from './domain/queue';
import { navbatCard, navbatRing, newCaseRing } from './infrastructure/navbat-card';
import { brandOf } from '../../shared/brand/brand-of';

// The cases come from drivers, complaints and users, set by the app (module-events.ts): the queue
// does not depend on them.
type Cases = (env: Bindings) => Promise<Case[]>;
let casesOf: Cases = async () => [];
export const wireTeamQueue = (next: Cases) => void (casesOf = next);
// The cases of the whole team, as «Navbat» lists them: the reminders of the Cron (G89 A5).
export const waitingCases = async (env: Bindings) => teamWork(await casesOf(env));

// What rings under «Navbat» (docs/122): a case after an empty queue, a case its member left too long
// (in team hours), an urgent complaint (day and night).
// sides: the people of a complaint; a moderator among them does not hear of it (G90 ADM-3).
export type QueueNews =
  | { readonly kind: 'new'; readonly sides?: readonly number[] }
  | { readonly kind: 'late'; readonly memberIds: readonly number[]; readonly text: string }
  | {
      readonly kind: 'urgent';
      readonly text: string;
      readonly markup?: object;
      readonly sides?: readonly number[];
    };

// total: the cases of the member's own «Navbat» (workOf), as the card counts them.
type Member = { readonly id: number; readonly role: string; readonly total: number };
const hears = (member: Member, sides: readonly number[] = []) =>
  member.role === 'owner' || !sides.includes(member.id);

function ringsOf(news: QueueNews | undefined, members: Member[], teamTime: boolean): Ring[] {
  if (news?.kind === 'late') return news.memberIds.map((id) => navbatRing(id, news.text, !teamTime));
  const sides = news?.sides;
  const heard = members.filter((member) => hears(member, sides));
  if (news?.kind === 'urgent') return heard.map(({ id }) => navbatRing(id, news.text, false, news.markup));
  // A case after an empty own queue (G90: a complaint about a member is not in his).
  if (news?.kind === 'new')
    return heard.filter(({ total }) => total === 1).map(({ id }) => newCaseRing(id, !teamTime));
  return [];
}

// The «Navbat» card of every member, edited when the queue changes and by the Cron (the minutes).
// The card is a window on the work: a failure must not stop the step that changed the queue.
export async function showQueue(env: Bindings, news?: QueueNews): Promise<void> {
  try {
    const brand = brandOf(env);
    const now = Date.now();
    const [cases, members] = await Promise.all([casesOf(env), teamMembers(env)]);
    const { hours } = brand.moderation;
    // Each card counts the work of its member, as «Navbat» of the app does (G90 ADM-3, ADM-9).
    const queues = members.map((member) => ({
      member,
      queue: queueOf(workOf(cases, member.id, member.role === 'owner'), now, hours),
    }));
    const counted = queues.map(({ member, queue }) => ({ ...member, total: queue.total }));
    await showCards(
      env,
      queues.map(({ member, queue }) => navbatCard(brand, member.id, queue, now)),
      ringsOf(news, counted, isTeamTime(now, hours)),
    );
  } catch (error) {
    console.warn(JSON.stringify({ event: 'team_queue_failed', message: String(error) }));
  }
}

// «Diqqat» kept with its data (G75): D1, or memory where there is none (tests, local runs).
const memorySigns = createMemorySigns();
const signsOf = (env: Bindings): SignStore => (env.DB ? d1Signs(env.DB) : memorySigns);
// «Navbat» in the admin app (G75): the same cases, who of the team opened each one.
const memoryTakes = createMemoryTakes();
export const attentionModule = attentionRoutes(signsOf)
  .route(
    '/',
    workRoutes((env) => casesOf(env)),
  )
  .route(
    '/',
    navbatRoutes({
      cases: (env) => casesOf(env),
      takes: (env) => (env.DB ? d1Takes(env.DB) : memoryTakes),
      name: async (env, memberId) => (await peopleOf(env).find(memberId))?.firstName ?? null,
    }),
  );

// A sign of the day for every owner in «Diqqat» (G68, docs/122): the same list in the admin app
// (G75); errors and a late case ring in team hours only. A sign must not stop the step that found it.
export async function tellOwners(env: Bindings, signal: Signal): Promise<void> {
  try {
    const brand = brandOf(env);
    const now = Date.now();
    const sign = attentionSignSchema.safeParse(signal.sign);
    if (sign.success) await signsOf(env).keep(tashkentDate(now), { id: signal.id, at: now, sign: sign.data });
    const ring = signal.ring
      ? { text: signal.text, quiet: !isTeamTime(now, brand.moderation.hours) }
      : undefined;
    for (const ownerId of adminIds(env)) await showNews(env, diqqatNews(brand, ownerId, signal, now), ring);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'owner_sign_failed', message: String(error) }));
  }
}

export { caseName } from './infrastructure/navbat-card';
