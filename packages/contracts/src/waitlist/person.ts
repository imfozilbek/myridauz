import { z } from 'zod';
import { CLIENT_PATTERN, VIA_PATTERN } from '../arrival';
import { CADENCES, PAINS, regionSchema, WAITLIST_ROLES, waitlistAnswersSchema } from './answers';

// The questionnaire of the main bot (G83, docs/181): no phone, no registration, the Telegram id only.
export const WAITLIST_PATH = '/waitlist';
export const WAITLIST_INVITE_PATH = '/waitlist/invite';
// The steps of the questionnaire in the analytics (docs/183): where people stop. «done» is the
// server's own event when the record is saved for the first time.
export const WAITLIST_STEPS = [
  'opened',
  'role',
  'pains',
  'route',
  'when',
  'channel_join',
  'invite_sent',
] as const;
export type WaitlistStep = (typeof WAITLIST_STEPS)[number];
export const waitlistStepFields = { step: z.enum(WAITLIST_STEPS), role: z.enum(WAITLIST_ROLES).optional() };

// The first opening of the app tells the source and the platform once (docs/116): the first touch
// counts, a later link changes nothing.
export const waitlistOpenSchema = z.object({
  via: z.string().regex(VIA_PATTERN).optional(),
  client: z.string().regex(CLIENT_PATTERN).optional(),
});

const count = z.number().int().nonnegative();
// How many wait on the direction: shown from 10 passengers only (docs/181). share: the percent of
// the passengers who chose the first pain of this person.
export const waitingSchema = z.object({
  passengers: count,
  drivers: count,
  share: z.number().min(0).max(100),
});
export type Waiting = z.infer<typeof waitingSchema>;

export const waitlistEntrySchema = z.object({
  role: z.enum(WAITLIST_ROLES),
  pains: z.array(z.enum(PAINS)),
  home: regionSchema,
  region: regionSchema,
  cadence: z.enum(CADENCES),
  waiting: waitingSchema.nullable(),
  // The direction is open: the bot told the person (docs/181).
  opened: z.boolean(),
});
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

export const waitlistMeSchema = z.object({
  // The switch of the owner (docs/181): closed, new people go to the trips instead.
  open: z.boolean(),
  entries: z.array(waitlistEntrySchema),
  // The brand channels the person is in (chat_member, G80): «✓ Aʼzosiz» and «N ta kanaldasiz».
  channels: z.array(z.string()),
});
export type WaitlistMe = z.infer<typeof waitlistMeSchema>;

export const waitlistSaveSchema = waitlistAnswersSchema;

// «Doʻstimni chaqiraman»: Telegram's own window with the card of the main bot; the plain link when
// Telegram says no (docs/43). The link carries the friend mark of the person (docs/116).
export const waitlistInviteSchema = z.object({ role: z.enum(WAITLIST_ROLES) });
export const waitlistInvitedSchema = z.object({ prepared: z.string().nullable(), link: z.url() });
export type WaitlistInvited = z.infer<typeof waitlistInvitedSchema>;
