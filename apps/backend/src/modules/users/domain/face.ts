import type { AvatarStatus, FaceDecision, FaceReason } from '@platform/contracts';

// The check of a face photo by the team (docs/118, G51). Using Rida never waits for it.
export type FaceCheck = {
  readonly status: AvatarStatus;
  // Why the team said no; null while waiting and once approved.
  readonly reason: FaceReason | null;
  // When the photo came: the queue of the team goes from the oldest.
  readonly at: number;
};

// Every new photo waits for the team, a driver's face too (docs/05: a new face is checked again).
export const newFace = (at: number): FaceCheck => ({ status: 'pending', reason: null, at });

// Only a waiting photo gets a decision: two moderators never decide the same photo twice.
export function judgeFace(face: FaceCheck, decision: FaceDecision): FaceCheck | 'users.face_decided' {
  if (face.status !== 'pending') return 'users.face_decided';
  if (decision.action === 'approve') return { ...face, status: 'approved', reason: null };
  return { ...face, status: 'rejected', reason: decision.reason };
}

// An approved driver application approves the face in it: the team saw it there (docs/04).
export const approvedFace = (face: FaceCheck): FaceCheck => ({ ...face, status: 'approved', reason: null });

// A driver photo is public: others see it once the team approved it (docs/118). A passenger photo
// the team checks after: it shows at once and goes on «Mos emas» (owner decision 19.10.2026, G51).
// Who may see it at all is docs/05 (avatar-visibility.ts). The owner always sees their own.
export const faceShown = (user: {
  readonly avatarKey: string | null;
  readonly isDriver: boolean;
  readonly face: FaceCheck | null;
}) => {
  if (user.avatarKey === null) return false;
  return user.isDriver ? user.face?.status === 'approved' : user.face?.status !== 'rejected';
};
