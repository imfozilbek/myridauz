import type { TranslationKey } from '@platform/i18n';
import type { IconName } from '../icons';
import type { Tone } from '../icon-tile';

// One action of the main screen: a title and a short hint, so anyone understands what is inside (docs/21).
export type StartAction = {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: Tone;
  readonly labelKey: TranslationKey;
  readonly hintKey: TranslationKey;
  // The section starts with "from" and "to" (G05); wholeRegion: a search may cover a whole region.
  readonly route?: { readonly wholeRegion: boolean };
};
