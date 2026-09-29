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
  // docs/37: 13 channels, Toshkent shahri has none (owner decision, docs/15).
  channels: {
    '1727': 'rida_toshkentvil',
    '1703': 'rida_andijon',
    '1706': 'rida_buxoro',
    '1730': 'rida_fargona',
    '1708': 'rida_jizzax',
    '1733': 'rida_xorazm',
    '1714': 'rida_namangan',
    '1712': 'rida_navoiy',
    '1710': 'rida_qashqadaryo',
    '1718': 'rida_samarqand',
    '1724': 'rida_sirdaryo',
    '1722': 'rida_surxondaryo',
    '1735': 'rida_qoraqalpogiston',
  },
  pricing: 'per-km',
};
