import {
  ADMIN_ATTENTION_PATH,
  ADMIN_CHANNEL_HEALTH_PATH,
  ADMIN_JOURNAL_PATH,
  ADMIN_NAVBAT_PATH,
  ADMIN_TEAM_PATH,
  ADMIN_WORK_PATH,
  adminPersonPath,
  adminTeamMemberPath,
  attentionSchema,
  channelHealthSchema,
  journalSchema,
  navbatSchema,
  navbatTakePath,
  personCardSchema,
  teamListSchema,
  userAvatarPath,
  workSchema,
  type Attention,
  type ChannelHealth,
  type Journal,
  type Navbat,
  type NavbatKind,
  type PersonCard,
  type PersonId,
  type TeamList,
  type Work,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The work of the team in the admin Mini App (G75, docs/120): «Navbat», «Diqqat», the numbers of
// the day, the journal, «Jamoa», «Odamlar» and the health of the channels.
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
    person: async (id: PersonId): Promise<PersonCard> =>
      personCardSchema.parse(await json(adminPersonPath(id))),
    channelHealth: async (): Promise<ChannelHealth> =>
      channelHealthSchema.parse(await json(ADMIN_CHANNEL_HEALTH_PATH)),
    // The photo of a member on the main screen: the admin app has no account of its own (G75).
    avatar: async (person: PersonId): Promise<Blob> => (await request(userAvatarPath(person))).blob(),
    remove: async (person: PersonId): Promise<void> =>
      void (await request(adminTeamMemberPath(person), { method: 'DELETE' })),
  };
}

export type TeamClient = ReturnType<typeof createTeamClient>;
