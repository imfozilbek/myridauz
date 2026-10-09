import {
  ADMIN_ATTENTION_PATH,
  ADMIN_JOURNAL_PATH,
  ADMIN_NAVBAT_PATH,
  ADMIN_TEAM_PATH,
  ADMIN_WORK_PATH,
  adminTeamMemberPath,
  attentionSchema,
  journalSchema,
  navbatSchema,
  navbatTakePath,
  teamListSchema,
  workSchema,
  type Attention,
  type Journal,
  type Navbat,
  type NavbatKind,
  type PersonId,
  type TeamList,
  type Work,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The work of the team in the admin Mini App (G75, docs/120): «Navbat», «Diqqat», the numbers of
// the day, the journal and «Jamoa».
export function createTeamClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  const json = async (path: string) => (await request(path)).json();
  return {
    navbat: async (): Promise<Navbat> => navbatSchema.parse(await json(ADMIN_NAVBAT_PATH)),
    take: async (kind: NavbatKind, id: string): Promise<void> =>
      void (await post(navbatTakePath(kind, id), {})),
    attention: async (): Promise<Attention> => attentionSchema.parse(await json(ADMIN_ATTENTION_PATH)),
    work: async (): Promise<Work> => workSchema.parse(await json(ADMIN_WORK_PATH)),
    journal: async (before?: number): Promise<Journal> =>
      journalSchema.parse(
        await json(before === undefined ? ADMIN_JOURNAL_PATH : `${ADMIN_JOURNAL_PATH}?before=${before}`),
      ),
    members: async (): Promise<TeamList> => teamListSchema.parse(await json(ADMIN_TEAM_PATH)),
    add: async (person: PersonId): Promise<void> => void (await post(ADMIN_TEAM_PATH, { person })),
    remove: async (person: PersonId): Promise<void> =>
      void (await request(adminTeamMemberPath(person), { method: 'DELETE' })),
  };
}

export type TeamClient = ReturnType<typeof createTeamClient>;
