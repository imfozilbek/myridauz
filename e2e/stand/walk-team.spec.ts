import { casesOfTeam, MODERATOR, NEW, OWNER } from './walk-cast';
import { walkEach } from './walk-report';

// The walk of the screens (G90) of the team, with an application, a complaint and a question in
// «Navbat», and of the MyRida questionnaire. Findings: screenshots/stand/walk/<name>.md.
walkEach(
  [
    ['team-owner', 'admin', OWNER],
    ['team-moderator', 'admin', MODERATOR],
    ['main-new', 'main', NEW],
  ],
  casesOfTeam,
);
