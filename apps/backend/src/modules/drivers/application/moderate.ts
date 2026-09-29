import type { ApplicationSummary, CarPhotoKind, DecisionInput } from '@platform/contracts';
import type { StoredImage } from '../../../shared/storage/image-store';
import { afterAvatarChange, decide, type Application } from '../domain/application';
import type { DriversDeps, Result } from './ports';

type ModerationError = 'drivers.not_found' | 'drivers.wrong_status';

async function summary(deps: DriversDeps, application: Application): Promise<ApplicationSummary | undefined> {
  const person = await deps.people.find(application.userId);
  if (!person || !application.car || application.submittedAt === null) return undefined;
  return {
    userId: application.userId,
    firstName: person.firstName,
    status: application.status,
    car: application.car,
    reasons: [...application.reasons],
    submittedAt: application.submittedAt,
  };
}

export async function queue(deps: DriversDeps): Promise<ApplicationSummary[]> {
  const items = await Promise.all((await deps.applications.queue()).map((item) => summary(deps, item)));
  return items.filter((item): item is ApplicationSummary => item !== undefined);
}

export async function applicationFor(
  deps: DriversDeps,
  userId: number,
): Promise<ApplicationSummary | undefined> {
  const application = await deps.applications.find(userId);
  return application ? summary(deps, application) : undefined;
}

// The team sees the face and the car of an applicant (docs/05: moderators see photos always).
export async function applicantPhoto(
  deps: DriversDeps,
  userId: number,
  kind: CarPhotoKind | 'avatar',
): Promise<StoredImage | undefined> {
  if (kind === 'avatar') {
    const key = (await deps.people.find(userId))?.avatarKey;
    return key ? deps.people.avatar(key) : undefined;
  }
  const key = (await deps.applications.find(userId))?.photos[kind];
  return key ? deps.photos.get(key) : undefined;
}

export async function decideApplication(
  deps: DriversDeps,
  moderatorId: number,
  userId: number,
  decision: DecisionInput,
): Promise<Result<ApplicationSummary, ModerationError>> {
  const application = await deps.applications.find(userId);
  if (!application) return { ok: false, error: 'drivers.not_found' };
  const next = decide(application, decision, moderatorId, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  await deps.applications.save(next);
  await deps.people.setDriver(userId, next.status === 'approved');
  if (next.status === 'approved') await deps.driverApproved(userId);
  const fixedPlate = next.car?.plate !== application.car?.plate ? (next.car?.plate ?? null) : null;
  await deps.notify.decided(next, fixedPlate);
  const view = await summary(deps, next);
  return view ? { ok: true, value: view } : { ok: false, error: 'drivers.not_found' };
}

// A new face of an approved driver goes back to the team (docs/05); a face to retake is fixed.
export async function avatarChanged(deps: DriversDeps, userId: number): Promise<void> {
  const application = await deps.applications.find(userId);
  const next = application ? afterAvatarChange(application, deps.now()) : null;
  const person = await deps.people.find(userId);
  if (!next || !person) return;
  await deps.applications.save(next);
  if (next.status !== 'pending') return;
  await deps.people.setDriver(userId, false);
  await deps.notify.submitted(next, person);
}
