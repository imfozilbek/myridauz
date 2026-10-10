import { Hono } from 'hono';
import type { AppEnv } from './env';
import { journalModule } from './modules/journal';
import { limitsModule } from './modules/limits';
import { peopleModule } from './modules/people';
import { supportCaseModule } from './modules/support-case';
import { teamModule } from './modules/team';
import { attentionModule } from './modules/team-queue';

// The screens of the team in the admin app (G75, docs/120): «Diqqat», «Navbat», the numbers of the
// day, the journal, «Jamoa», «Odamlar», «Cheklovlar» and the questions of support.
export const teamScreens = new Hono<AppEnv>()
  .route('/', attentionModule)
  .route('/', journalModule)
  .route('/', teamModule)
  .route('/', peopleModule)
  .route('/', limitsModule)
  .route('/', supportCaseModule);
