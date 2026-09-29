import type { BrandConfig } from '../brand-config';
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
  bots: { passenger: 'myrida_bot', driver: 'myrida_haydovchi_bot', admin: 'myrida_admin_bot' },
  pricing: 'per-km',
};
