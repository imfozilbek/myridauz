import {
  ADMIN_APPLICATIONS_PATH,
  ADMIN_ME_PATH,
  adminApplicationPath,
  adminBlockPath,
  adminBlocksPath,
  adminDecisionPath,
  adminPhotoPath,
  adminUnblockPath,
  applicationDetailSchema,
  applicationQueueSchema,
  applicationSummarySchema,
  blockJournalSchema,
  type ApplicationDetail,
  type ApplicationSummary,
  type BlockJournal,
  type BlockInput,
  type CarPhotoKind,
  type DecisionInput,
  type PersonId,
  teamMeSchema,
  type TeamMe,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team works with driver applications and blocks from the admin Mini App (docs/04, docs/17).
export function createModerationClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  return {
    me: async (): Promise<TeamMe> => teamMeSchema.parse(await (await request(ADMIN_ME_PATH)).json()),
    queue: async (): Promise<ApplicationSummary[]> =>
      applicationQueueSchema.parse(await (await request(ADMIN_APPLICATIONS_PATH)).json()).applications,
    get: async (userId: PersonId): Promise<ApplicationDetail> =>
      applicationDetailSchema.parse(await (await request(adminApplicationPath(userId))).json()),
    photo: async (userId: PersonId, kind: CarPhotoKind | 'avatar'): Promise<Blob> =>
      (await request(adminPhotoPath(userId, kind))).blob(),
    decide: async (userId: PersonId, decision: DecisionInput): Promise<ApplicationSummary> =>
      applicationSummarySchema.parse(await (await post(adminDecisionPath(userId), decision)).json()),
    block: async (userId: PersonId, days: BlockInput['days']): Promise<void> => {
      await post(adminBlockPath(userId), { days });
    },
    // The block journal of a person; only the owner lifts a block (docs/65 C).
    blocks: async (userId: PersonId): Promise<BlockJournal> =>
      blockJournalSchema.parse(await (await request(adminBlocksPath(userId))).json()),
    unblock: async (userId: PersonId): Promise<void> => {
      await post(adminUnblockPath(userId), {});
    },
  };
}

export type ModerationClient = ReturnType<typeof createModerationClient>;
