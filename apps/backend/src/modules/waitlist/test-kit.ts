import type { WaitlistAnswers, WaitlistRole } from '@platform/contracts';
import { testD1 } from '../../test-d1';
import type { AdDeps } from './application/ads';
import type { CardView } from './application/person';
import type { TeamDeps } from './application/team';
import { d1Ads } from './infrastructure/d1-ads';
import { d1Openings, d1Switches } from './infrastructure/d1-openings';
import { d1Records } from './infrastructure/d1-records';
import { d1TeamReads } from './infrastructure/d1-team-reads';
import { d1Visits } from './infrastructure/d1-visits';

// Test helper: the use cases of the list over real SQLite (testD1), the bot and the clock faked.
export function setup(start = Date.parse('2026-10-14T10:00:00Z')) {
  const db = testD1();
  let now = start;
  const shown: CardView[][] = [];
  const rung: CardView[][] = [];
  const listed: WaitlistRole[] = [];
  const journal: string[] = [];
  const invites: string[] = [];
  const deps: TeamDeps = {
    records: d1Records(db),
    visits: d1Visits(db),
    openings: d1Openings(db),
    switches: d1Switches(db),
    reads: d1TeamReads(db),
    channels: async () => ['-1001'],
    cards: async (views) => void shown.push([...views]),
    ring: async (views) => void rung.push([...views]),
    listed: (role) => void listed.push(role),
    approved: async (ids) => ids.filter((id) => id % 2 === 1).length,
    journal: async (by, subject, action) => void journal.push(`${by} ${subject} ${action}`),
    cached: (_key, load) => load(),
    now: () => now,
  };
  const ads: AdDeps = {
    ads: d1Ads(db),
    switches: deps.switches,
    botLink: (code) => `https://t.me/main_bot?start=${code}`,
    channels: new Set(['@main', '-1001']),
    invite: async (chat, name) => (chat === '-1001' ? `https://t.me/+${name.length}xyz` : null),
    journal: deps.journal,
    now: () => now,
  };
  return {
    db,
    deps,
    ads,
    shown,
    rung,
    listed,
    journal,
    invites,
    later: (ms: number) => void (now += ms),
    at: () => now,
  };
}

export const passengerAnswers = (overrides: Partial<WaitlistAnswers> = {}): WaitlistAnswers => ({
  role: 'passenger',
  pains: ['chats', 'phone'],
  home: '1718',
  region: '1718',
  cadence: 'weekly',
  ...overrides,
});

export const driverAnswers = (overrides: Partial<WaitlistAnswers> = {}): WaitlistAnswers => ({
  role: 'driver',
  pains: ['empty'],
  home: '1718',
  region: '1718',
  cadence: 'daily',
  ...overrides,
});
