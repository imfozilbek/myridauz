import { z } from 'zod';
import { VIA_PATTERN } from './arrival';
import { personIdSchema } from './person-id';

// G99 (docs/234): every event says who, where the person first came from, and on what Telegram.
// who: the public id of the person, before the registration the id of the session; never a phone,
// a name or a Telegram ID (docs/29). entry: the mark of the first touch («ch-…», «ad-…», «direct»).
// tg: the version of Telegram WebApp («8.0»); platform: android, ios, tdesktop, weba, macos, unknown.
export const stampFields = {
  who: z.union([personIdSchema, z.uuid()]).optional(),
  entry: z.string().regex(VIA_PATTERN).optional(),
  tg: z
    .string()
    .regex(/^\d{1,2}(\.\d{1,2}){0,2}$/)
    .optional(),
  platform: z
    .string()
    .regex(/^[a-z_]{1,16}$/)
    .optional(),
};
export type Stamp = { readonly [Key in keyof typeof stampFields]?: string | undefined };
