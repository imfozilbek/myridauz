import type { NavbatOpen } from '../flow/start-action';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';

// A button of the admin bot opens one case in «Navbat» (G75): "?complaint=<id>" of an urgent
// complaint (docs/17). An application opens from «Navbat» itself: no bot sends a link to it (G77).
const COMPLAINT = 'complaint';
const COMPLAINT_ID = /^[A-Za-z0-9-]{1,64}$/u;

export function linkedCase(): NavbatOpen | null {
  const complaint = launchParam(COMPLAINT, COMPLAINT_ID);
  return complaint ? { filter: 'complaint', kind: 'complaint', id: complaint } : null;
}

// Once opened, the link is forgotten: going back shows the main screen of the team.
export function forgetLinkedCase(): void {
  forgetLaunchParam(COMPLAINT);
}
