import { z } from 'zod';
import { plateSchema } from './plate';

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
// Each reason points to the place the driver fixes: a photo, the plate or the car data.
// profile: the whole application, not one place.
export type ProblemPlace = 'avatar' | CarPhotoKind | 'plate' | 'car' | 'profile';
export const REASON_PLACE = {
  face_not_visible: 'avatar',
  front_unclear: 'front',
  plate_not_readable: 'front',
  side_unclear: 'side',
  interior_unclear: 'interior',
  plate_mismatch: 'plate',
  car_mismatch: 'car',
  fake_profile: 'profile',
} as const satisfies Record<string, ProblemPlace>;
export type ModerationReason = keyof typeof REASON_PLACE;
export const MODERATION_REASONS = Object.keys(REASON_PLACE) as readonly ModerationReason[];
const reasonSchema = z.enum(MODERATION_REASONS as [ModerationReason, ...ModerationReason[]]);
// One or more reasons: a driver fixes everything in one go.
export const reasonsSchema = z.array(reasonSchema).min(1).max(MODERATION_REASONS.length);

// The reasons that point to one place, in the given order.
export const reasonsAt = (reasons: readonly ModerationReason[], place: ProblemPlace) =>
  reasons.filter((reason) => REASON_PLACE[reason] === place);

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
const NAME_MIN = 2;
const NAME_MAX = 32;

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
  plate: plateSchema,
  seats: z.number().int().min(1).max(MAX_SEATS),
});
export type Car = z.infer<typeof carSchema>;
export type CarInput = z.input<typeof carSchema>;

const photosSchema = z.object({ front: z.boolean(), side: z.boolean(), interior: z.boolean() });

// What the applicant sees: their own application, never another one.
const driverApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  car: carSchema.nullable(),
  photos: photosSchema,
  reasons: z.array(reasonSchema),
});
export type DriverApplication = z.infer<typeof driverApplicationSchema>;

export const driverApplicationResponseSchema = z.object({ application: driverApplicationSchema.nullable() });
export type DriverApplicationResponse = z.infer<typeof driverApplicationResponseSchema>;
