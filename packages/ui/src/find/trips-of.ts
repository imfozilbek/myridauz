import type { DirectionCard } from '@platform/contracts';
import type { I18n } from '@platform/i18n';

// The trips of a direction today and tomorrow in words, or null when it has none (docs/118, path 2).
export function tripsOf(t: I18n['t'], card: DirectionCard): string | null {
  if (card.today > 0 && card.tomorrow > 0)
    return t('find.tripsBoth', { today: String(card.today), tomorrow: String(card.tomorrow) });
  if (card.today > 0) return t('find.tripsToday', { count: String(card.today) });
  if (card.tomorrow > 0) return t('find.tripsTomorrow', { count: String(card.tomorrow) });
  return null;
}
