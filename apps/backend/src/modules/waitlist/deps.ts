import { botStartLink, TASHKENT_CITY } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { prepareCard } from '../../shared/telegram/prepared-card';
import { recordServerEvent } from '../analytics';
import { adInviteLink, channelsOfPerson } from '../channels';
import { approvedCar } from '../drivers';
import { recordAction } from '../journal';
import { placesOf } from '../locations';
import { showCards } from '../notifications';
import { statsCached } from '../stats';
import { regionTripsOf } from '../trips';
import type { AdDeps } from './application/ads';
import type { BotJobDeps } from './application/bot-jobs';
import type { InviteDeps } from './application/invite';
import type { CardView, PersonDeps } from './application/person';
import type { TeamDeps } from './application/team';
import { openedRing, waitlistCard } from './infrastructure/card-text';
import { d1Ads } from './infrastructure/d1-ads';
import { d1Openings, d1Switches } from './infrastructure/d1-openings';
import { d1Records } from './infrastructure/d1-records';
import { d1TeamReads } from './infrastructure/d1-team-reads';
import { d1Visits } from './infrastructure/d1-visits';
import { friendLink, inviteText } from './infrastructure/invite-text';

const { t } = createI18n(DEFAULT_LOCALE);

// The trips of today and tomorrow on an opened direction, from the person's own end (docs/181).
const tripsOf = (env: Bindings, { record, opened }: CardView) => {
  if (!opened || record.role === 'driver') return null;
  const fromCity = record.home === TASHKENT_CITY;
  return regionTripsOf(
    env,
    fromCity ? TASHKENT_CITY : record.region,
    fromCity ? record.region : TASHKENT_CITY,
  );
};

async function cardsOf(env: Bindings, views: readonly CardView[]) {
  const [brand, places, now] = [brandOf(env), await placesOf(env), Date.now()];
  return Promise.all(
    views.map(async (view) => waitlistCard(brand, view, places, now, await tripsOf(env, view))),
  );
}

const journal = (env: Bindings) => (by: number, subject: string, action: string) =>
  recordAction(env, { memberId: by, kind: 'waitlist', subject, action, since: null });

// The waitlist lives in D1 only (migration 0066): without it the list is not there (local runs).
export function botJobDeps(env: Bindings): BotJobDeps | null {
  const db = env.DB;
  if (!db) return null;
  return {
    records: d1Records(db),
    visits: d1Visits(db),
    openings: d1Openings(db),
    switches: d1Switches(db),
    channels: (userId) => channelsOfPerson(env, userId),
    cards: async (views) => showCards(env, await cardsOf(env, views)),
    ring: async (views) => {
      const places = await placesOf(env);
      await showCards(
        env,
        await cardsOf(env, views),
        views.map((view) => openedRing(view, places)),
      );
    },
    listed: (role) =>
      recordServerEvent(env, { name: 'waitlist_step', source: 'main', code: `${role}.listed` }),
    now: () => Date.now(),
  };
}

// «Doʻstimni chaqiraman»: the card of the main bot with the friend link of the person (docs/181).
export function personDeps(env: Bindings): (PersonDeps & InviteDeps) | null {
  const base = botJobDeps(env);
  if (!base) return null;
  const brand = brandOf(env);
  const words = {
    title: t('bot.main.friend.title', { brand: brand.name }),
    button: t('bot.main.friend.button'),
  };
  return {
    ...base,
    prepare: async (record, code) => {
      const link = friendLink(brand, code);
      const text = inviteText(brand, record, await placesOf(env));
      const send = (input: string, init?: RequestInit) => fetch(input, init);
      return {
        prepared: await prepareCard(send, env.MAIN_BOT_TOKEN, record.userId, text, link, words),
        link,
      };
    },
  };
}

export function teamDeps(env: Bindings): TeamDeps | null {
  const base = botJobDeps(env);
  if (!base || !env.DB) return null;
  return {
    ...base,
    reads: d1TeamReads(env.DB),
    cached: (key, load) => statsCached(env, key, load),
    approved: async (ids) =>
      (await Promise.all(ids.map((id) => approvedCar(env, id)))).filter(Boolean).length,
    journal: journal(env),
  };
}

export function adDeps(env: Bindings): AdDeps | null {
  const db = env.DB;
  if (!db) return null;
  const brand = brandOf(env);
  return {
    ads: d1Ads(db),
    switches: d1Switches(db),
    botLink: (target, code) =>
      target === 'passenger' || target === 'driver'
        ? botStartLink(brand.bots[target], code)
        : `https://t.me/${brand.bots.main}?start=${code}`,
    channels: new Set([`@${brand.mainChannel}`, ...brand.channels.map(({ chat }) => chat)]),
    invite: (chat, name) => adInviteLink(env, chat, name),
    journal: journal(env),
    now: () => Date.now(),
  };
}
