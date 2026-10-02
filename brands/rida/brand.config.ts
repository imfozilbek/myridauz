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
  calls: { ringSeconds: 30, connectSeconds: 15 },
  // docs/30: the requisites are placeholders until the owner has them (owner decision).
  company: {
    legalName: '{{company_legal_name}}',
    form: '{{company_form}}',
    stir: '{{company_stir}}',
    address: '{{company_address}}',
    email: 'myrida.llc@gmail.com',
  },
};
