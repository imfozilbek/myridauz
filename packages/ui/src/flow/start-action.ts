import type { AppLink, Location } from '@platform/contracts';
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
  // A driver waits for the approval of the application before this action works (docs/86 V7).
  readonly waitsApproval?: true;
  // The section; without it the action says the section comes soon.
  readonly Screen?: ComponentType<{ readonly onBack: () => void } & Launch>;
};

// How the main screen opens a section (G25): a booking or a trip by its link, the search right at
// a point of the way, a new trip with a known route.
export type Launch = {
  readonly link?: AppLink;
  readonly pick?: 'from' | 'to';
  readonly route?: { readonly from: Location; readonly to: Location };
};
// The block of the main screen opens the section of an action with what to show first.
export type HomeGo = (actionId: string, launch?: Launch) => void;
