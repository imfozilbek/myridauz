import { z } from 'zod';
import { APPLICATION_STATUSES, carSchema, reasonsSchema, type CarPhotoKind } from './drivers';
import { plateSchema } from './plate';

// The team checks driver applications and blocks people (docs/04, docs/17). G06.
export const ADMIN_APPLICATIONS_PATH = '/admin/applications';
export const adminApplicationPath = (userId: number) => `${ADMIN_APPLICATIONS_PATH}/${userId}`;
export const adminPhotoPath = (userId: number, kind: CarPhotoKind | 'avatar') =>
  `${adminApplicationPath(userId)}/photos/${kind}`;
export const adminDecisionPath = (userId: number) => `${adminApplicationPath(userId)}/decision`;
export const adminBlockPath = (userId: number) => `/admin/users/${userId}/block`;

export const TEAM_ROLES = ['owner', 'moderator'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const applicationSummarySchema = z.object({
  userId: z.number().int(),
  firstName: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  car: carSchema,
  reasons: z.array(reasonsSchema.element),
  submittedAt: z.number().int(),
});
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export const applicationQueueSchema = z.object({ applications: z.array(applicationSummarySchema) });

export const DECISIONS = ['approve', 'reject', 'request_changes'] as const;
export type Decision = (typeof DECISIONS)[number];
export const decisionSchema = z.discriminatedUnion('action', [
  // plate: the moderator read another plate on the front photo and fixed it before approving.
  z.object({ action: z.literal('approve'), plate: plateSchema.optional() }),
  z.object({ action: z.literal('reject'), reasons: reasonsSchema }),
  z.object({ action: z.literal('request_changes'), reasons: reasonsSchema }),
]);
export type DecisionInput = z.infer<typeof decisionSchema>;

// A block for 1, 7 or 30 days, or for good (null), docs/17.
export const BLOCK_DAYS = [1, 7, 30] as const;
export const blockSchema = z.object({
  days: z.union([z.literal(BLOCK_DAYS[0]), z.literal(BLOCK_DAYS[1]), z.literal(BLOCK_DAYS[2]), z.null()]),
});
export type BlockInput = z.infer<typeof blockSchema>;
