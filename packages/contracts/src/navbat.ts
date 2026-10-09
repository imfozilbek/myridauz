import { z } from 'zod';
import { COMPLAINT_REASONS } from './complaints';

// «Navbat» of the team (docs/120, G75): every case in one list, the oldest first; the same cases the
// card of the admin bot counts. Any member of the team reads it.
export const ADMIN_NAVBAT_PATH = '/admin/navbat';
export const NAVBAT_KINDS = ['application', 'complaint', 'face', 'support'] as const;
export type NavbatKind = (typeof NAVBAT_KINDS)[number];
// «Aziz koʻrmoqda»: a member opened the case, the others see it this long (gap К of docs/158).
export const navbatTakePath = (kind: NavbatKind, id: string) => `${ADMIN_NAVBAT_PATH}/${kind}/${id}/take`;
export const TAKE_MINUTES = 10;

const count = z.number().int().nonnegative();
const name = z.string().max(64);
// The id of a case: the public id of the person (application, photo, support), or of the complaint.
const base = {
  id: z.string().min(1).max(64),
  name,
  since: z.number().int(),
  // Waited in team hours, the night not counted (G34); late: over the limit of the owner.
  minutes: count,
  late: z.boolean(),
  // Another member opened it in the last minutes.
  takenBy: name.nullable(),
};

export const navbatItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('application'),
    ...base,
    car: z.object({ make: name, model: name, plate: z.string().max(16) }),
  }),
  z.object({ kind: z.literal('complaint'), ...base, against: name, reason: z.enum(COMPLAINT_REASONS) }),
  z.object({ kind: z.literal('face'), ...base }),
  z.object({ kind: z.literal('support'), ...base }),
]);
export type NavbatItem = z.infer<typeof navbatItemSchema>;

export const navbatSchema = z.object({
  items: z.array(navbatItemSchema),
  counts: z.object({ application: count, complaint: count, face: count, support: count }),
});
export type Navbat = z.infer<typeof navbatSchema>;
