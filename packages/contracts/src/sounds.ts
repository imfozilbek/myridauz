import { z } from 'zod';

// The sounds of the brand (docs/115): the Mini Apps read the set in use without a signature; the
// team sees the sets in the admin Mini App and the owner picks one. Every pick is kept with its author.
export const PUBLIC_SOUNDS_PATH = '/public/sounds';
export const ADMIN_SOUNDS_PATH = '/admin/sounds';

const setSchema = z.string().min(1).max(20);
// The pick of the owner, and the answer to the Mini Apps: the same one field.
export const soundChoiceSchema = z.object({ set: setSchema });
export type SoundChoice = z.infer<typeof soundChoiceSchema>;

export const soundsStateSchema = z.object({
  set: setSchema,
  sets: z.array(setSchema),
  // Who picked the set and when; null while the default of the brand plays.
  changedBy: z.number().int().nullable(),
  changedAt: z.number().int().nullable(),
  canEdit: z.boolean(),
});
export type SoundsState = z.infer<typeof soundsStateSchema>;

// The files of a set, next to the Mini App (brands/<brand>/public/sounds).
export const soundFile = (set: string, kind: 'ring' | 'notify') => `sounds/${set}-${kind}.wav`;
