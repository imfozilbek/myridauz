import { z } from 'zod';

// Users, registration and profile (docs/02, docs/05, docs/07, docs/17). G04.
export const ME_PATH = '/me';
export const REGISTRATION_PATH = '/me/registration';
export const MY_AVATAR_PATH = '/me/avatar';
export const WRITE_ACCESS_PATH = '/me/write-access';
export const userPath = (id: number) => `/users/${id}`;
export const userAvatarPath = (id: number) => `${userPath(id)}/avatar`;

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];
export const USER_ROLES = ['passenger', 'driver', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// The client compresses the photo to about 200 KB (docs/05); the server accepts a little more.
export const AVATAR_TARGET_BYTES = 200 * 1024;
export const MAX_AVATAR_BYTES = 320 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/webp'] as const;

// A first name only: letters, spaces, apostrophes, hyphens. No digits or @: a name must not carry
// a phone number or a username (contacts are never shown, docs/07).
const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 32;
const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}ʻʼ'‘’ -]*$/u;
export const nameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH).regex(NAME_PATTERN));

export const registrationSchema = z.object({
  consent: z.literal(true),
  firstName: nameSchema,
  gender: z.enum(GENDERS),
  // Raw signed string from Telegram requestContact: the server checks the signature.
  contact: z.string().min(1).max(4096),
});
export type RegistrationInput = z.input<typeof registrationSchema>;

export const writeAccessSchema = z.object({ allowed: z.boolean() });

const settingsSchema = z.object({ passengerAvatarRequired: z.boolean() });

// Only the owner sees their phone. Other people get publicProfileSchema.
export const myProfileSchema = z.object({
  id: z.number().int(),
  firstName: z.string(),
  gender: z.enum(GENDERS),
  phone: z.string(),
  roles: z.array(z.enum(USER_ROLES)),
  hasAvatar: z.boolean(),
  writeAccess: z.boolean(),
  // null: no ratings yet, shown as "Yangi" (new).
  rating: z.number().nullable(),
});
export type MyProfile = z.infer<typeof myProfileSchema>;

export const meResponseSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('unregistered'), suggestedName: z.string(), settings: settingsSchema }),
  // until: epoch ms, null: blocked for good.
  z.object({ state: z.literal('blocked'), until: z.number().nullable() }),
  z.object({ state: z.literal('active'), profile: myProfileSchema, settings: settingsSchema }),
]);
export type MeResponse = z.infer<typeof meResponseSchema>;

export const publicProfileSchema = z.strictObject({
  id: z.number().int(),
  firstName: z.string(),
  hasAvatar: z.boolean(),
  rating: z.number().nullable(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
