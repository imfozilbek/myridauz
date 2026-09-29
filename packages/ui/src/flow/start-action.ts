import type { TranslationKey } from '@platform/i18n';
import type { ComponentType } from 'react';
import type { IconName } from '../icons';
import type { Tone } from '../icon-tile';

// One action of the main screen: a title and a short hint, so anyone understands what is inside (docs/21).
export type StartAction = {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: Tone;
  readonly labelKey: TranslationKey;
  readonly hintKey: TranslationKey;
  // The section; without it the action says the section comes soon.
  readonly Screen?: ComponentType<{ readonly onBack: () => void }>;
};
