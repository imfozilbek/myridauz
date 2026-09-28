import { z } from 'zod';

// A driver application (docs/04). G06.
export const DRIVER_APPLICATION_PATH = '/driver/application';
export const CAR_PHOTO_KINDS = ['front', 'side', 'interior'] as const;
export type CarPhotoKind = (typeof CAR_PHOTO_KINDS)[number];
export const driverPhotoPath = (kind: CarPhotoKind) => `${DRIVER_APPLICATION_PATH}/photos/${kind}`;

// draft: photos are being added, nothing sent yet. The four statuses of docs/04 follow.
export const APPLICATION_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'changes_requested',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Reasons are codes with a text for people in the i18n catalog (docs/13): the moderator chooses, not types.
export const MODERATION_REASONS = [
  'face_not_visible',
  'plate_not_readable',
  'photos_unclear',
  'car_mismatch',
  'fake_profile',
] as const;
export type ModerationReason = (typeof MODERATION_REASONS)[number];

// Seats for passengers: up to 7 for minivans (docs/35).
export const MAX_SEATS = 7;
export const CAR_COLORS = [
  'white',
  'black',
  'silver',
  'gray',
  'blue',
  'red',
  'green',
  'yellow',
  'brown',
  'beige',
] as const;
export type CarColor = (typeof CAR_COLORS)[number];
export const CAR_YEAR_MIN = 1980;
const NAME_MIN = 2;
const NAME_MAX = 32;

// Uzbek plates: "01 A 123 BC" (a person) or "01 123 ABC" (a company). Kept without spaces.
const PLATE_PATTERN = /^\d{2}(?:[A-Z]\d{3}[A-Z]{2}|\d{3}[A-Z]{3})$/;
export const plateSchema = z
  .string()
  .transform((value) => value.toUpperCase().replace(/[\s-]/g, ''))
  .pipe(z.string().regex(PLATE_PATTERN));

const carNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(NAME_MIN)
      .max(NAME_MAX)
      .regex(/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u),
  );

export const carSchema = z.object({
  make: carNameSchema,
  model: carNameSchema,
  color: z.enum(CAR_COLORS),
  year: z.number().int().min(CAR_YEAR_MIN),
  plate: plateSchema,
  seats: z.number().int().min(1).max(MAX_SEATS),
});
export type Car = z.infer<typeof carSchema>;
export type CarInput = z.input<typeof carSchema>;

const photosSchema = z.object({ front: z.boolean(), side: z.boolean(), interior: z.boolean() });

// What the applicant sees: their own application, never another one.
export const driverApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  car: carSchema.nullable(),
  photos: photosSchema,
  reason: z.enum(MODERATION_REASONS).nullable(),
});
export type DriverApplication = z.infer<typeof driverApplicationSchema>;

export const driverApplicationResponseSchema = z.object({ application: driverApplicationSchema.nullable() });
export type DriverApplicationResponse = z.infer<typeof driverApplicationResponseSchema>;
