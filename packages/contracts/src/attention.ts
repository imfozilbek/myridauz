import { z } from 'zod';
import { personIdSchema } from './person-id';
import { FUNNELS, funnelStepIdSchema } from './stats';

// «Diqqat» of the owner (docs/120, docs/122): the signs of the day, one list for the card of the
// admin bot and for the admin app. Only the owner reads it (G75).
export const ADMIN_ATTENTION_PATH = '/admin/attention';

const count = z.number().int().nonnegative();
const name = z.string().max(64);
const person = personIdSchema;

export const attentionSignSchema = z.discriminatedUnion('kind', [
  // The errors of the last hour against a usual hour (docs/29).
  z.object({ kind: z.literal('errors'), hour: count, usual: count }),
  // A step of a funnel lost more people than usual (docs/29).
  z.object({
    kind: z.literal('drop'),
    funnel: z.enum(FUNNELS),
    step: funnelStepIdSchema,
    drop: z.number(),
    usual: z.number(),
  }),
  // An application waited over the limit of the owner: whose, and which member has it (G34).
  z.object({ kind: z.literal('late'), name, moderator: name, minutes: count }),
  // Contacts typed in a chat (docs/07): the chat key opens it in the admin app.
  z.object({ kind: z.literal('contact'), name, person, count, chat: z.string().max(80) }),
  // A rating under the line of the brand (docs/24).
  z.object({ kind: z.literal('rating'), name, person, average: z.number(), count }),
  // A driver whose wallet is enough for few seats (docs/12).
  z.object({ kind: z.literal('money'), name, person, seats: count }),
]);
export type AttentionSign = z.infer<typeof attentionSignSchema>;

export const attentionSchema = z.object({
  signs: z.array(z.object({ id: z.string(), at: z.number().int(), sign: attentionSignSchema })),
});
export type Attention = z.infer<typeof attentionSchema>;
