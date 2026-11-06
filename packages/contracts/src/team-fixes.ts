import { z } from 'zod';
import { carSchema } from './drivers';
import { adminApplicationPath } from './moderation';
import { personIdSchema, type PersonId } from './person-id';
import { plateSchema } from './plate';

// The team finds and fixes its own decisions about driver applications (G95, docs/224).

// «Mening qarorlarim»: the decisions of the one who asks, the newest first, for 7 days.
export const ADMIN_MY_DECISIONS_PATH = '/admin/me/decisions';
export const MY_DECISIONS_DAYS = 7;
export const DECIDED_STATUSES = ['approved', 'changes_requested', 'rejected'] as const;
export const myDecisionsSchema = z.object({
  decisions: z.array(
    z.object({
      userId: personIdSchema,
      firstName: z.string(),
      status: z.enum(DECIDED_STATUSES),
      plate: plateSchema,
      at: z.number().int(),
    }),
  ),
});
export type MyDecision = z.infer<typeof myDecisionsSchema>['decisions'][number];

// «Mashinani tuzatish»: the car of an approved driver by the front photo; the seats follow the model.
export const adminCarFixPath = (userId: PersonId) => `${adminApplicationPath(userId)}/car`;
export const carFixSchema = carSchema;
// «Rad etishni bekor qilish»: the owner sends a rejected application back to «Navbat».
export const adminReopenPath = (userId: PersonId) => `${adminApplicationPath(userId)}/reopen`;
