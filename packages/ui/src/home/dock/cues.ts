import type { DriverState } from './driver-state';
import type { PassengerState } from './passenger-state';

// «Hozir: …» over the block (G76, docs/165, docs/166, mockups g76/2, g76/3): dark for a hint, amber
// when soon, red when someone waits or something is short. A state without it changes quietly.
type CueTone = 'dark' | 'soon' | 'now';
export type Cue = { readonly key: CueKey; readonly tone: CueTone };
type CueKey =
  | 'start'
  | 'forYou'
  | 'first'
  | 'question'
  | 'rate'
  | 'offer'
  | 'answer'
  | 'go'
  | 'depart'
  | 'mark'
  | 'driverWaits'
  | 'passengerWaits'
  | 'fix'
  | 'topUp';

const cue = (key: CueKey, tone: CueTone): Cue => ({ key, tone });

const PASSENGER: Partial<Record<PassengerState['kind'], Cue>> = {
  favorite: cue('forYou', 'dark'),
  offers: cue('offer', 'soon'),
  moved: cue('answer', 'soon'),
  meeting: cue('go', 'soon'),
  driverWaits: cue('driverWaits', 'now'),
  arrivedAsk: cue('question', 'dark'),
  ended: cue('rate', 'dark'),
};

const DRIVER: Partial<Record<DriverState['kind'], Cue>> = {
  draft: cue('start', 'dark'),
  fix: cue('fix', 'now'),
  welcome: cue('first', 'dark'),
  requests: cue('answer', 'soon'),
  short: cue('topUp', 'now'),
  depart: cue('depart', 'soon'),
  passengerWaits: cue('passengerWaits', 'now'),
  atPoint: cue('mark', 'soon'),
  departAsk: cue('mark', 'soon'),
  ended: cue('rate', 'dark'),
};

// A new person with nothing yet is shown where to start (mockup g76/2 state 1).
export const passengerCue = (kind: PassengerState['kind'], fresh: boolean): Cue | null =>
  PASSENGER[kind] ?? (kind === 'idle' && fresh ? cue('start', 'dark') : null);

export const driverCue = (kind: DriverState['kind']): Cue | null => DRIVER[kind] ?? null;
