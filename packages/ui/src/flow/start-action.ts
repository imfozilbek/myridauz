import type { AppLink, Location, NavbatKind, PersonId, RequestBoardQuery } from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import type { ComponentType } from 'react';
import type { IconName } from '../icons';
import type { TripAgain } from '../market/trip-draft';
import type { TripScreen } from '../own-trip/own-trip-opened';
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
  // Pale until the approval, with its own hint (G62, mockup g62/1 screen 4).
  readonly paleUntilApproval?: true;
  // What its tile says live (G53): read where the tile is drawn, so a section loads only its own data.
  readonly useLive?: () => TileLive;
  // The section the action opens.
  readonly Screen: ComponentType<{ readonly onBack: () => void } & Launch>;
};

// What a tile of the main screen says now (G53): how many things wait for the person (a badge),
// another hint, or a number of the day (the admin Mini App).
export type TileLive = {
  readonly badge?: number;
  // «Soʻrov qoldirish» becomes «Soʻrovim» and opens the open request (G66, docs/118).
  readonly title?: string;
  readonly hint?: string;
  readonly opens?: { readonly id: string; readonly launch?: Launch };
  readonly value?: number;
  // The number is work waiting for the team: it is red (G53).
  readonly urgent?: boolean;
};

// How the main screen opens a section (G25): a booking or a trip by its link, the search right at
// a point of the way, a new trip with a known route or the whole last trip.
export type Launch = {
  readonly link?: AppLink;
  // The trip of the link opens right on «Safar tugadi» or its map (G76).
  readonly tripScreen?: TripScreen;
  readonly pick?: 'from' | 'to';
  readonly route?: { readonly from: Location; readonly to: Location };
  // One end of the block at the bottom (G76, docs/165): the other one is asked first.
  readonly from?: Location;
  readonly to?: Location;
  // The requests of passengers from the «Qayerdan» of the block (G76).
  readonly board?: RequestBoardQuery;
  // «Oxirgi yoʻnalish»: the answers of the last trip, only the day is asked (G40, docs/106 K3).
  readonly again?: TripAgain;
  // The new trip is out: «Qaytish safari» of the block counts its way back (G76, docs/29).
  readonly onPublished?: () => void;
  // A case of «Navbat» opened from the main screen of the team, in the filter it was seen (G75).
  readonly navbat?: NavbatOpen;
  // A person of a sign of «Diqqat» opened in «Odamlar» (G75).
  readonly person?: PersonId;
};
// «Hammasi» or one kind of cases (docs/120).
export type NavbatFilter = 'all' | NavbatKind;
export type NavbatOpen = { readonly filter: NavbatFilter; readonly kind: NavbatKind; readonly id: string };
// The block of the main screen opens the section of an action with what to show first.
export type HomeGo = (actionId: string, launch?: Launch) => void;
