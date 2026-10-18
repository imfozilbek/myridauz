import { isQuietTime } from '@platform/contracts';
import type { Bindings } from '../../env';
import { teamMembers } from '../team';
import { cardJob, ringJob, type Card, type Ring } from './application/cards';
import { newsCard, type News } from './application/news';
import { deadPostsByChannel } from './infrastructure/dead-posts';
import { notify, notifyMass } from './infrastructure/lanes';
import { cardsOf, newsOf } from './infrastructure/wiring';

export type { NotificationJob, QueueMessage, TimedTask } from './application/job';
export type { Card, Ring } from './application/cards';
export type { News, NewsLine } from './application/news';
export { forgetCards, forgetOldCards } from './infrastructure/d1-cards';
export { handleAfterSent } from './infrastructure/deliver-now';
export { notify, notifyMass, scheduleTasks } from './infrastructure/lanes';
export { consumeNotifications, MAX_ATTEMPTS, type TaskRunners } from './infrastructure/consumer';

// fast: the answer to a person's own step, at once and first; mass: one of many messages at once,
// at an even pace (G85 T2, docs/122).
type Lane = 'fast' | 'mass';
const laneOf = (lane: Lane) => (lane === 'mass' ? notifyMass : notify);

// Live cards and their rings (G68, docs/122): a card is sent, edited or left as it is; a ring
// comes after its card, so it can answer it.
export async function showCards(
  env: Bindings,
  cards: readonly Card[],
  rings: readonly Ring[] = [],
  lane: Lane = 'fast',
) {
  const store = cardsOf(env);
  const changed = await Promise.all(cards.map(async (card) => ({ card, job: await cardJob(store, card) })));
  const jobs = changed.flatMap(({ job }) => (job ? [job] : []));
  // A news card refreshes the open Mini App even when its message did not change or is not there.
  const news = changed.flatMap(({ card, job }) =>
    card.loud || card.refresh ? [job ?? { bot: card.bot, chatId: card.chatId, text: '' }] : [],
  );
  const ringing = rings.map(ringJob);
  await laneOf(lane)(env, [...jobs, ...ringing], [...news, ...ringing]);
}

// The news of a route in its card of the day (docs/122 rule 4): the first one rings, unless it is
// night; the next ones of the day edit it without sound. A ring, when given, answers the card.
export async function showNews(
  env: Bindings,
  news: News,
  ring?: Pick<Ring, 'text' | 'quiet'>,
  lane: Lane = 'fast',
) {
  const now = Date.now();
  const card = await newsCard(newsOf(env), news, now, news.quiet === true || isQuietTime(now));
  const rings = ring ? [{ ...ring, bot: news.bot, chatId: news.chatId, card: card.key }] : [];
  await showCards(env, [card], rings, lane);
}

// A message for every team member through the admin bot (docs/02).
export async function notifyTeam(env: Bindings, text: string, markup?: object): Promise<void> {
  const team = await teamMembers(env);
  await notify(
    env,
    team.map((member) => ({ bot: 'admin' as const, chatId: member.id, text, ...(markup ? { markup } : {}) })),
  );
}

// The channel posts Telegram never took since a moment, by channel («Kanallar» of the owner, G75).
export const deadChannelPosts = async (env: Bindings, since: number) =>
  env.DB ? deadPostsByChannel(env.DB, since) : new Map<string, number>();
