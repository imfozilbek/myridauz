import {
  REASON_PLACE,
  type ApplicationStatus,
  type Car,
  type CarPhotoKind,
  type DecisionInput,
  type ModerationReason,
  type ProblemPlace,
} from '@platform/contracts';

// A driver application (docs/04): one per person, edited in place.
type CarPhotos = Readonly<Record<CarPhotoKind, string | null>>;

export type Application = {
  readonly userId: number;
  readonly status: ApplicationStatus;
  readonly car: Car | null;
  readonly photos: CarPhotos;
  // Why the team said no: each reason points to a photo or a field (none while waiting or approved).
  readonly reasons: readonly ModerationReason[];
  readonly submittedAt: number | null;
  readonly decidedBy: number | null;
  readonly updatedAt: number;
};

export const emptyApplication = (userId: number, now: number): Application => ({
  userId,
  status: 'draft',
  car: null,
  photos: { front: null, side: null, interior: null },
  reasons: [],
  submittedAt: null,
  decidedBy: null,
  updatedAt: now,
});

const hasAllPhotos = (photos: CarPhotos) => Object.values(photos).every((key) => key !== null);
// A fixed place is no longer a problem: the driver sees only what is left to fix.
const fixed = (reasons: readonly ModerationReason[], place: ProblemPlace) =>
  reasons.filter((reason) => REASON_PLACE[reason] !== place);

// While the team checks an application it does not change under their eyes; «Rad etish» is the last
// word of the team (docs/120): a rejected application is never sent again.
const closed = (application: Application) =>
  application.status === 'pending' || application.status === 'rejected';

// A new photo of an approved car is a change of the car: it goes back to the check (docs/04).
// While the team checks the application, it does not change under their eyes.
export function withPhoto(
  application: Application,
  kind: CarPhotoKind,
  key: string,
  now: number,
): Application | 'drivers.wrong_status' {
  if (closed(application)) return 'drivers.wrong_status';
  const status = application.status === 'approved' ? 'draft' : application.status;
  const photos = { ...application.photos, [kind]: key };
  return { ...application, status, photos, reasons: fixed(application.reasons, kind), updatedAt: now };
}

export type SubmitError = 'drivers.incomplete' | 'drivers.wrong_status';

// The avatar is required: without it the application does not go to the check (docs/05).
export function submit(
  application: Application,
  car: Car,
  hasAvatar: boolean,
  now: number,
): Application | SubmitError {
  if (closed(application)) return 'drivers.wrong_status';
  if (!hasAvatar || !hasAllPhotos(application.photos)) return 'drivers.incomplete';
  return { ...application, status: 'pending', car, reasons: [], submittedAt: now, updatedAt: now };
}

const DECIDED: Record<DecisionInput['action'], ApplicationStatus> = {
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'changes_requested',
};

// Only a waiting application gets a decision: two moderators never decide the same one twice.
export function decide(
  application: Application,
  decision: DecisionInput,
  moderatorId: number,
  now: number,
): Application | 'drivers.wrong_status' {
  if (application.status !== 'pending') return 'drivers.wrong_status';
  const reasons = decision.action === 'approve' ? [] : decision.reasons;
  // The team may fix the plate by the front photo before approving (docs/50).
  const plate = decision.action === 'approve' ? decision.plate : undefined;
  const car = plate && application.car ? { ...application.car, plate } : application.car;
  const status = DECIDED[decision.action];
  return { ...application, status, car, reasons, decidedBy: moderatorId, updatedAt: now };
}

// A new face of an approved driver is checked again (docs/05). Other statuses wait for the next submit,
// but a face the team asked to retake is fixed now. null: nothing changes.
export function afterAvatarChange(application: Application, now: number): Application | null {
  if (application.status === 'approved') {
    return { ...application, status: 'pending', submittedAt: now, updatedAt: now };
  }
  const reasons = fixed(application.reasons, 'avatar');
  return reasons.length === application.reasons.length ? null : { ...application, reasons, updatedAt: now };
}
