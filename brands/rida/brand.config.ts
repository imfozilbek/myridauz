import type { BrandConfig } from '../brand-config';
// 20 channel zones over all districts (owner decision 30.09.2026, docs/63): one zone per road
// direction, every district in exactly one zone; Toshkent shahri has none (docs/15).
import channels from './channels.json' with { type: 'json' };
import { theme } from './theme.ts';

export const brandConfig: BrandConfig = {
  id: 'rida',
  name: 'Rida',
  domain: 'myrida.uz',
  slogan: 'Manzil sari',
  monetization: 'commission',
  // docs/12: 10% per seat, at least 3 000 sum per seat; up to 3 × 500 000 sum of bonus.
  commission: { percent: 10, minPerSeat: 3000 },
  promo: { amount: 500_000, grants: 3, days: 30, windowDays: 90 },
  theme,
  regionPhotos: true,
  bots: {
    passenger: 'myrida_bot',
    driver: 'myrida_haydovchi_bot',
    admin: 'myrida_admin_bot',
    support: 'myrida_support_bot',
  },
  channels,
  pricing: 'per-km',
  // docs/29: 3 times the usual hour and at least 10 errors; a step 20 points worse than the week
  // from at least 20 people; the same signal once in 6 hours.
  alerts: { errorGrowth: 3, minErrors: 10, dropGrowth: 20, minPeople: 20, repeatHours: 6 },
  // docs/08: no answer in 30 seconds or no voice in 15 seconds: the call ends, the chat stays.
  // docs/115: the bot calls a person in 5 seconds after the ring if their Mini App did not open the chat.
  calls: { ringSeconds: 30, connectSeconds: 15, inviteSeconds: 5 },
  // docs/115 (owner decision 04.10.2026): three sets, the third («ri-da, ri-DAAA») by default.
  sounds: { sets: ['1', '2', '3'], defaultSet: '3' },
  // G34 (owner decision 02.10.2026): an answer within the hour from 7:00 to 23:00; a reminder to the
  // moderator after 30 minutes, to the owner after 50.
  moderation: { hours: { from: 7, to: 23 }, remindMinutes: 30, ownerMinutes: 50 },
  // docs/30: the requisites come from the admin Mini App (G34); this address answers until they do.
  company: { email: 'myrida.llc@gmail.com' },
  // G38 (owner decisions 03.10.2026, docs/103): a trip leaves an hour after it is made at the earliest;
  // another day opens at 08:00; at most 3 trips; gathering people takes half the road, 1 to 3 hours.
  schedule: {
    leadMinutes: 60,
    defaultTime: '08:00',
    maxActiveTrips: 3,
    gather: { factor: 0.5, minMinutes: 60, maxMinutes: 180 },
  },
};
