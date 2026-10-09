import type { PersonId } from '@platform/contracts';
import type { ReactNode } from 'react';
import type { IconName } from '../icons';

// What a sheet asks for, in the order the sheets come (docs/122): a call first, then the meeting,
// a request or an offer, an answer of the other side, a message last.
export const ACTION_ORDER = ['call', 'meeting', 'request', 'offer', 'answer', 'message'] as const;
export type ActionKind = (typeof ACTION_ORDER)[number];

// One tap of a sheet. run gives the words of the plaque on top after it («Madina tasdiqlandi»), or
// nothing: then the sheet only closes.
export type SheetAction = {
  readonly label: string;
  readonly icon?: IconName;
  readonly run: () => Promise<string | undefined> | string | undefined;
};

// One thing to answer (mockups g68/7, g68/8): the face, who and what, a short trip card, the main
// button and «Keyinroq». The same parts for every kind and both roles.
export type ActionItem = {
  // «<kind>:<id>»: the id of the booking, offer or chat; a bot link names it (docs/122).
  readonly key: string;
  readonly kind: ActionKind;
  readonly face: { readonly id: PersonId; readonly name: string; readonly hasAvatar: boolean };
  readonly badge?: IconName;
  readonly kicker: string;
  readonly title: string;
  readonly sub?: ReactNode;
  readonly body?: ReactNode;
  // Above the buttons, in the colour of the app: «Javob berish uchun 29 daqiqa».
  readonly alert?: string;
  // Ready answers: above the main button («Yaxshi», «Kutaman»), or under it («5 daqiqada»).
  readonly chips?: readonly SheetAction[];
  readonly chipsBelow?: boolean;
  readonly main: SheetAction;
  // The left button of a pair: «Rad etish». A call paints both buttons (red and green).
  readonly second?: SheetAction;
  readonly call?: boolean;
  // «Barcha takliflar (2)» before «Keyinroq».
  readonly more?: SheetAction;
  // The words of «Keyinroq» («Yaxshi» after an answer); null: none, as on a call.
  readonly later?: string | null;
  // Grey words under the buttons: «Raqamlar yashirin».
  readonly note?: string;
  // Put aside in any way (an answer, «Keyinroq», a tap beside): an answer once seen stays away.
  readonly onAside?: () => void;
};

export const itemKey = (kind: ActionKind, id: string) => `${kind}:${id}`;
export const idOf = (key: string) => key.slice(key.indexOf(':') + 1);
