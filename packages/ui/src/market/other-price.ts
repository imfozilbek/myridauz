import type { Trip } from '@platform/contracts';

// «Tavsiya etilgan narx» next to the price only when it says something new (G35, docs/97 PS10).
export const otherPrice = ({ price, recommendedPrice }: Trip): number | null =>
  recommendedPrice !== null && recommendedPrice !== price ? recommendedPrice : null;
