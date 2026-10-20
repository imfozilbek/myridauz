import type { FaceDecision, FaceSummary } from '@platform/contracts';
import type { StoredImage } from '../../../shared/storage/image-store';
import { judgeFace } from '../domain/face';
import type { User } from '../domain/user';
import type { Failure, UsersDeps } from './ports';

// The team checks new face photos (docs/120, G51): «Rasm mos» or «Mos emas» with a reason.
export async function pendingFaces(deps: UsersDeps): Promise<FaceSummary[]> {
  return (await deps.users.pendingFaces()).flatMap((user) =>
    user.face ? [{ userId: user.publicId, firstName: user.firstName, uploadedAt: user.face.at }] : [],
  );
}

// The team sees every photo (docs/05).
export async function facePhoto(deps: UsersDeps, userId: number): Promise<StoredImage | undefined> {
  const key = (await deps.users.find(userId))?.avatarKey;
  return key ? deps.avatars.get(key) : undefined;
}

type FaceError = 'users.not_found' | 'users.face_decided';

// The decision goes to the journal; a photo that does not fit is told to the person with the reason.
export async function decideFace(
  deps: UsersDeps,
  moderatorId: number,
  userId: number,
  decision: FaceDecision,
): Promise<{ readonly ok: true; readonly user: User } | Failure<FaceError>> {
  const user = await deps.users.find(userId);
  if (!user?.face || user.avatarKey === null) return { ok: false, error: 'users.not_found' };
  // The moderator saw an older photo: the new one waits for its own look (G89 M8).
  if (decision.at !== undefined && decision.at !== user.face.at)
    return { ok: false, error: 'users.face_decided' };
  const face = judgeFace(user.face, decision);
  if (typeof face === 'string') return { ok: false, error: face };
  const now = deps.now();
  const next = { ...user, face };
  // One guarded write: two taps or two members at once decide once (G89 A8).
  if (!(await deps.users.decideFace(userId, face, user.face.at)))
    return { ok: false, error: 'users.face_decided' };
  const status = decision.action === 'approve' ? 'approved' : 'rejected';
  await deps.faceLog.add({ userId, status, reason: face.reason, by: moderatorId, at: now });
  if (decision.action === 'reject') await deps.faces.rejected(next, decision.reason);
  await deps.faces.decided();
  return { ok: true, user: next };
}
