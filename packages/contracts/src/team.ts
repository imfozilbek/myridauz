import { z } from 'zod';
import { TEAM_ROLES } from './moderation';
import { personIdSchema, type PersonId } from './person-id';

// «Jamoa» in the admin app (G75, docs/120): the owner adds and removes moderators of registered people;
// the admin bot no longer does it (docs/50). The owner may type the Telegram ID a colleague sent (G84):
// it only goes in, the API never gives one out (docs/65 A3).
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
export const telegramIdSchema = z.string().regex(/^\d{1,15}$/u);
export const teamPersonSchema = z.union([personIdSchema, telegramIdSchema]);
export const teamAddSchema = z.object({ person: teamPersonSchema });
