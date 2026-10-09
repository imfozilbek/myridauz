import { loadBrand } from '@platform/brands';
import { isTeamTime } from '@platform/contracts';
import type { Bindings } from '../../env';
import { adminIds } from '../../shared/telegram/bot-config';
import { showCards, showNews, type Ring } from '../notifications';
import { teamMembers } from '../team';
import { diqqatNews, type Signal } from './infrastructure/diqqat-card';
import { queueOf, type Case } from './domain/queue';
import { navbatCard, navbatRing, newCaseRing } from './infrastructure/navbat-card';

// The cases come from drivers, complaints and users, set by the app (module-events.ts): the queue
// does not depend on them.
type Cases = (env: Bindings) => Promise<Case[]>;
let casesOf: Cases = async () => [];
export const wireTeamQueue = (next: Cases) => void (casesOf = next);

// What rings under «Navbat» (docs/122): a case after an empty queue, a case its member left too long
// (in team hours), an urgent complaint (day and night).
export type QueueNews =
  | { readonly kind: 'new' }
  | { readonly kind: 'late'; readonly memberId: number; readonly text: string }
  | { readonly kind: 'urgent'; readonly text: string; readonly markup?: object };

function ringsOf(news: QueueNews | undefined, total: number, members: number[], teamTime: boolean): Ring[] {
  if (news?.kind === 'urgent') return members.map((id) => navbatRing(id, news.text, false, news.markup));
  if (news?.kind === 'late') return [navbatRing(news.memberId, news.text, !teamTime)];
  if (news?.kind === 'new' && total === 1) return members.map((id) => newCaseRing(id, !teamTime));
  return [];
}

// The «Navbat» card of every member, edited when the queue changes and by the Cron (the minutes).
// The card is a window on the work: a failure must not stop the step that changed the queue.
export async function showQueue(env: Bindings, news?: QueueNews): Promise<void> {
  try {
    const brand = loadBrand(env.BRAND);
    const now = Date.now();
    const [cases, members] = await Promise.all([casesOf(env), teamMembers(env)]);
    const queue = queueOf(cases, now, brand.moderation.hours);
    const ids = members.map((member) => member.id);
    const rings = ringsOf(news, queue.total, ids, isTeamTime(now, brand.moderation.hours));
    await showCards(
      env,
      ids.map((id) => navbatCard(brand, id, queue, now)),
      rings,
    );
  } catch (error) {
    console.warn(JSON.stringify({ event: 'team_queue_failed', message: String(error) }));
  }
}

// A sign of the day for every owner in «Diqqat» (G68, docs/122); errors and a late case ring in team
// hours only. A sign must not stop the step that found it.
export async function tellOwners(env: Bindings, signal: Signal): Promise<void> {
  try {
    const brand = loadBrand(env.BRAND);
    const now = Date.now();
    const ring = signal.ring
      ? { text: signal.text, quiet: !isTeamTime(now, brand.moderation.hours) }
      : undefined;
    for (const ownerId of adminIds(env)) await showNews(env, diqqatNews(brand, ownerId, signal, now), ring);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'owner_sign_failed', message: String(error) }));
  }
}

export { caseName } from './infrastructure/navbat-card';
