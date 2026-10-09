import { z } from 'zod';
import { personIdSchema, type PersonId } from './person-id';
import { APPLICATION_STATUSES, carSchema, reasonsSchema, type CarPhotoKind } from './drivers';
import { plateSchema } from './plate';
import { FACE_REASONS } from './users';

// The team checks driver applications and blocks people (docs/04, docs/17). G06.
export const ADMIN_APPLICATIONS_PATH = '/admin/applications';
export const adminApplicationPath = (userId: PersonId) => `${ADMIN_APPLICATIONS_PATH}/${userId}`;
export const adminPhotoPath = (userId: PersonId, kind: CarPhotoKind | 'avatar') =>
  `${adminApplicationPath(userId)}/photos/${kind}`;
export const adminDecisionPath = (userId: PersonId) => `${adminApplicationPath(userId)}/decision`;
export const adminBlockPath = (userId: PersonId) => `/admin/users/${userId}/block`;
export const adminBlocksPath = (userId: PersonId) => `/admin/users/${userId}/blocks`;
export const adminUnblockPath = (userId: PersonId) => `/admin/users/${userId}/unblock`;

// The block now and every block before it: who, when, until when, why (docs/65 C).
const BLOCK_REASONS = ['admin', 'complaint', 'unblock'] as const;
export const blockJournalSchema = z.object({
  active: z.object({ until: z.number().int().nullable() }).nullable(),
  entries: z.array(
    z.object({
      until: z.number().int().nullable(),
      reason: z.enum(BLOCK_REASONS),
      by: z.string(),
      at: z.number().int(),
    }),
  ),
});
export type BlockJournal = z.infer<typeof blockJournalSchema>;

export const TEAM_ROLES = ['owner', 'moderator'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

// Who opened the admin Mini App: the name and the role on its main screen (G53).
export const ADMIN_ME_PATH = '/admin/me';
// The card shows the own photo (mockup g67/1): the public id, never the Telegram ID (docs/65 A3);
// null for an owner who never registered in the apps of people.
export const teamMeSchema = z.object({
  id: personIdSchema.nullable(),
  firstName: z.string(),
  hasAvatar: z.boolean(),
  role: z.enum(TEAM_ROLES),
});
export type TeamMe = z.infer<typeof teamMeSchema>;

export const applicationSummarySchema = z.object({
  userId: personIdSchema,
  firstName: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  car: carSchema,
  reasons: z.array(reasonsSchema.element),
  submittedAt: z.number().int(),
});
export type ApplicationSummary = z.infer<typeof applicationSummarySchema>;
export const applicationQueueSchema = z.object({ applications: z.array(applicationSummarySchema) });

// One application opened by the team: every earlier decision and how many other people sent the
// same plate (docs/65 C).
export const applicationDetailSchema = applicationSummarySchema.extend({
  history: z.array(
    z.object({
      status: z.enum(APPLICATION_STATUSES),
      reasons: z.array(reasonsSchema.element),
      at: z.number().int(),
    }),
  ),
  samePlate: z.number().int(),
  // The car the team approved before, when the driver sent another one (G75, «было → стало»).
  was: carSchema.nullable(),
});
export type ApplicationDetail = z.infer<typeof applicationDetailSchema>;

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

// New face photos of people for the team, the oldest first: «Rasm mos» or «Mos emas» with a reason
// (docs/120, G51).
export const ADMIN_FACES_PATH = '/admin/faces';
export const adminFacePhotoPath = (userId: PersonId) => `${ADMIN_FACES_PATH}/${userId}/photo`;
export const adminFaceDecisionPath = (userId: PersonId) => `${ADMIN_FACES_PATH}/${userId}/decision`;
export const faceQueueSchema = z.object({
  faces: z.array(z.object({ userId: personIdSchema, firstName: z.string(), uploadedAt: z.number().int() })),
});
export type FaceSummary = z.infer<typeof faceQueueSchema>['faces'][number];
export const faceDecisionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.enum(FACE_REASONS) }),
]);
export type FaceDecision = z.infer<typeof faceDecisionSchema>;
