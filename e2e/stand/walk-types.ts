// What the walk of the screens (G91) writes down where a person gets stuck or a tap makes no sense.
//  dead_end: not the main screen, no «Назад», no button of Telegram, nothing to tap;
//  no_back: not the main screen and no «Назад»: Android «Назад» closes the whole app there;
//  dead_tap: a tap that changes nothing, calls nothing, opens nothing;
//  refused: the screen offered a tap and the server said no to it;
//  error_screen: the screen shows the general error.
// drifts: how often the world changed under the robot (a seat confirmed, a trip cancelled) and a
// screen it walked was not there any more: counted, not a finding.
export type FindingKind = 'dead_end' | 'no_back' | 'dead_tap' | 'refused' | 'error_screen';
export type Finding = {
  readonly kind: FindingKind;
  readonly at: string;
  readonly path: string;
  readonly detail: string;
};
export type WalkReport = {
  readonly findings: Finding[];
  readonly screens: number;
  readonly taps: number;
  readonly drifts: number;
  readonly named: string[];
};
