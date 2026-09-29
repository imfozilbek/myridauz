import type { BrandConfig } from '../brand-config';
import { theme } from './theme.ts';

export const brandConfig: BrandConfig = {
  id: 'rida',
  name: 'Rida',
  domain: 'myrida.uz',
  slogan: 'Manzil sari',
  monetization: 'commission',
  theme,
  regionPhotos: true,
  bots: { passenger: 'myrida_bot', driver: 'myrida_haydovchi_bot', admin: 'myrida_admin_bot' },
  pricing: 'per-km',
};
