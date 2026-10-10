import { z } from 'zod';
import { TEAM_ROLES } from './moderation';
import { personIdSchema, type PersonId } from './person-id';

// «Jamoa» in the admin app (G75, docs/120): the owner adds and removes moderators by the public id
// of a registered person; the admin bot no longer does it (docs/50). Never a Telegram ID (docs/65 A3).
export const ADMIN_TEAM_PATH = '/admin/team';
export const adminTeamMemberPath = (id: PersonId) => `${ADMIN_TEAM_PATH}/${id}`;

export const teamListSchema = z.object({
  members: z.array(
    z.object({
      id: personIdSchema,
      firstName: z.string(),
      hasAvatar: z.boolean(),
      role: z.enum(TEAM_ROLES),
    }),
  ),
});
export type TeamList = z.infer<typeof teamListSchema>;
export const teamAddSchema = z.object({ person: personIdSchema });
