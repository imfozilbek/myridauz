import { PERSON_LINK, type PersonId } from '@platform/contracts';
import { forgetLaunchParam, launchParam } from '../telegram/launch-param';

// «Profilni ochish» under a support question opens its person in «Odamlar» (Q8 of docs/111, G45):
// ?open=people&person=<public id>.
const PERSON_ID = /^[0-9a-f]{32}$/u;
export const linkedPerson = (): PersonId | null => launchParam(PERSON_LINK, PERSON_ID);

// Once opened, the link is forgotten: going back shows the main screen of the team.
export function forgetLinkedPerson(): void {
  forgetLaunchParam(PERSON_LINK);
}
