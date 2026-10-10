import { personIdSchema } from '@platform/contracts';
import type { NavbatOpen } from '../flow/start-action';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';

// A button of the admin bot opens one case in «Navbat» (G75): "?complaint=<id>" of an urgent
// complaint (docs/17) or "?application=<public id>" (docs/50, docs/65 A3).
const COMPLAINT = 'complaint';
const APPLICATION = 'application';
const COMPLAINT_ID = /^[A-Za-z0-9-]{1,64}$/u;
const ANY = /^.+$/u;

export function linkedCase(): NavbatOpen | null {
  const complaint = launchParam(COMPLAINT, COMPLAINT_ID);
  if (complaint) return { filter: 'complaint', kind: 'complaint', id: complaint };
  const application = personIdSchema.safeParse(launchParam(APPLICATION, ANY));
  return application.success ? { filter: 'application', kind: 'application', id: application.data } : null;
}

// Once opened, the link is forgotten: going back shows the main screen of the team.
export function forgetLinkedCase(): void {
  forgetLaunchParam(COMPLAINT);
  forgetLaunchParam(APPLICATION);
}
