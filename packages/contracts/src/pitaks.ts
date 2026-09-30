import { z } from 'zod';
import { locationIdSchema } from './locations';
import { pitakSchema } from './pickup';
import { pointInputSchema } from './point';

// Pitaks in the admin (G24, docs/72): a point, a name, a status; the live directions «region A →
// region B» with their main pitak; every change in the history. The team keeps the list.
export const ADMIN_PITAKS_PATH = '/admin/pitaks';
export const adminPitakPath = (id: string) => `${ADMIN_PITAKS_PATH}/${id}`;
export const ADMIN_PITAK_HISTORY_PATH = `${ADMIN_PITAKS_PATH}-history`;
export const ADMIN_PITAK_DIRECTIONS_PATH = '/admin/pitak-directions';

// «claude»: chosen by Claude without a check by people (owner decision 30.09.2026).
export const PITAK_STATUSES = ['candidate', 'claude', 'checked', 'closed'] as const;
export type PitakStatus = (typeof PITAK_STATUSES)[number];
// People see only these; a candidate and a closed pitak stay in the admin.
export const SHOWN_PITAK_STATUSES: readonly PitakStatus[] = ['claude', 'checked'];
export const PITAK_NAME_MAX = 80;

export const pitakInputSchema = z.object({
  name: z.string().trim().min(2).max(PITAK_NAME_MAX),
  point: pointInputSchema,
  status: z.enum(PITAK_STATUSES),
});
export type PitakInput = z.input<typeof pitakInputSchema>;

export const adminPitakSchema = pitakSchema.extend({
  // The region by the point and the borders, never typed by hand (docs/72).
  regionId: locationIdSchema,
  status: z.enum(PITAK_STATUSES),
  updatedAt: z.number().int(),
});
export type AdminPitak = z.infer<typeof adminPitakSchema>;

// A live direction and its main pitak (null: no pitak yet, only «from the door»).
export const pitakDirectionSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  pitakId: z.string().nullable(),
});
export type PitakDirection = z.infer<typeof pitakDirectionSchema>;

export const adminPitaksSchema = z.object({
  pitaks: z.array(adminPitakSchema),
  directions: z.array(pitakDirectionSchema),
});

export const pitakChangeSchema = z.object({
  subject: z.string(),
  before: z.string().nullable(),
  after: z.string().nullable(),
  at: z.number().int(),
});
export type PitakChange = z.infer<typeof pitakChangeSchema>;
export const pitakHistorySchema = z.object({ changes: z.array(pitakChangeSchema) });
