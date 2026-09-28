import type {
  ApplicationStatus,
  Car,
  CarPhotoKind,
  DecisionInput,
  ModerationReason,
} from '@platform/contracts';

// A driver application (docs/04): one per person, edited in place.
export type CarPhotos = Readonly<Record<CarPhotoKind, string | null>>;

export type Application = {
  readonly userId: number;
  readonly status: ApplicationStatus;
  readonly car: Car | null;
  readonly photos: CarPhotos;
  readonly reason: ModerationReason | null;
  readonly submittedAt: number | null;
  readonly decidedBy: number | null;
  readonly updatedAt: number;
};

export const emptyApplication = (userId: number, now: number): Application => ({
  userId,
  status: 'draft',
  car: null,
  photos: { front: null, side: null, interior: null },
  reason: null,
  submittedAt: null,
  decidedBy: null,
  updatedAt: now,
});

const hasAllPhotos = (photos: CarPhotos) => Object.values(photos).every((key) => key !== null);

// A new photo of an approved car is a change of the car: it goes back to the check (docs/04).
// While the team checks the application, it does not change under their eyes.
export function withPhoto(
  application: Application,
  kind: CarPhotoKind,
  key: string,
  now: number,
): Application | 'drivers.wrong_status' {
  if (application.status === 'pending') return 'drivers.wrong_status';
  const status = application.status === 'approved' ? 'draft' : application.status;
  return { ...application, status, photos: { ...application.photos, [kind]: key }, updatedAt: now };
}

export type SubmitError = 'drivers.incomplete' | 'drivers.wrong_status';

// The avatar is required: without it the application does not go to the check (docs/05).
export function submit(
  application: Application,
  car: Car,
  hasAvatar: boolean,
  now: number,
): Application | SubmitError {
  if (application.status === 'pending') return 'drivers.wrong_status';
  if (!hasAvatar || !hasAllPhotos(application.photos)) return 'drivers.incomplete';
  return { ...application, status: 'pending', car, reason: null, submittedAt: now, updatedAt: now };
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
  const reason = decision.action === 'approve' ? null : decision.reason;
  return { ...application, status: DECIDED[decision.action], reason, decidedBy: moderatorId, updatedAt: now };
}

// A new face of an approved driver is checked again (docs/05). Other statuses wait for the next submit.
export function afterAvatarChange(application: Application, now: number): Application | null {
  if (application.status !== 'approved') return null;
  return { ...application, status: 'pending', submittedAt: now, updatedAt: now };
}
