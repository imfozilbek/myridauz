import {
  ADMIN_APPLICATIONS_PATH,
  adminApplicationPath,
  adminBlockPath,
  adminDecisionPath,
  adminPhotoPath,
  applicationQueueSchema,
  applicationSummarySchema,
  type ApplicationSummary,
  type BlockInput,
  type CarPhotoKind,
  type DecisionInput,
  type PersonId,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team works with driver applications and blocks from the admin Mini App (docs/04, docs/17).
export function createModerationClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  return {
    queue: async (): Promise<ApplicationSummary[]> =>
      applicationQueueSchema.parse(await (await request(ADMIN_APPLICATIONS_PATH)).json()).applications,
    get: async (userId: PersonId): Promise<ApplicationSummary> =>
      applicationSummarySchema.parse(await (await request(adminApplicationPath(userId))).json()),
    photo: async (userId: PersonId, kind: CarPhotoKind | 'avatar'): Promise<Blob> =>
      (await request(adminPhotoPath(userId, kind))).blob(),
    decide: async (userId: PersonId, decision: DecisionInput): Promise<ApplicationSummary> =>
      applicationSummarySchema.parse(await (await post(adminDecisionPath(userId), decision)).json()),
    block: async (userId: PersonId, days: BlockInput['days']): Promise<void> => {
      await post(adminBlockPath(userId), { days });
    },
  };
}

export type ModerationClient = ReturnType<typeof createModerationClient>;
