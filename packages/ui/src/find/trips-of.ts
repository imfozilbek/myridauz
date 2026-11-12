import type { DirectionCard } from '@platform/contracts';
import type { I18n, TranslationKey } from '@platform/i18n';

type Words = {
  readonly both: TranslationKey;
  readonly today: TranslationKey;
  readonly tomorrow: TranslationKey;
};

// What goes to a direction today and tomorrow in words, or null when nothing does (docs/118, path 2).
const countsOf =
  (words: Words) =>
  (t: I18n['t'], card: DirectionCard): string | null => {
    if (card.today > 0 && card.tomorrow > 0)
      return t(words.both, { today: String(card.today), tomorrow: String(card.tomorrow) });
    if (card.today > 0) return t(words.today, { count: String(card.today) });
    if (card.tomorrow > 0) return t(words.tomorrow, { count: String(card.tomorrow) });
    return null;
  };

// The trips for a passenger: «Bugun 2 ta, ertaga 5 ta safar».
export const tripsOf = countsOf({
  both: 'find.tripsBoth',
  today: 'find.tripsToday',
  tomorrow: 'find.tripsTomorrow',
});

// The requests of passengers for a driver (owner decision 12.11.2026): «Ertaga 2 ta soʻrov».
export const requestsOf = countsOf({
  both: 'find.requestsBoth',
  today: 'find.requestsToday',
  tomorrow: 'find.requestsTomorrow',
});
