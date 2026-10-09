import { z } from 'zod';
import type { PersonId } from './person-id';

// A question of support in «Navbat» (G75, docs/158 К): the talk with the person and the answer of
// the team from the admin app; it reaches the person from the support bot as «Operator N» (G32).
export const ADMIN_SUPPORT_PATH = '/admin/support';
export const adminSupportPath = (person: PersonId) => `${ADMIN_SUPPORT_PATH}/${person}`;
export const adminSupportAnswerPath = (person: PersonId) => `${adminSupportPath(person)}/answer`;
export const SUPPORT_ANSWER_MAX = 1000;

export const supportCaseSchema = z.object({
  name: z.string(),
  // The person is blocked now and writes about the block (gap К of docs/158).
  appeal: z.boolean(),
  // The person or «Operator N» of the team, never the name of a member; the oldest first.
  talk: z.array(
    z.object({
      author: z.enum(['person', 'team']),
      name: z.string(),
      kind: z.enum(['text', 'voice', 'photo']),
      text: z.string(),
      at: z.number().int(),
    }),
  ),
});
export type SupportCase = z.infer<typeof supportCaseSchema>;

export const supportAnswerSchema = z.object({ text: z.string().trim().min(1).max(SUPPORT_ANSWER_MAX) });
export type SupportAnswer = z.infer<typeof supportAnswerSchema>;
