import { faceShown } from './face';
import type { User } from './user';

// How the viewer is linked to the owner of the photo: passengers of one trip ride together (G08).
export type TripRelation = 'co_passenger' | 'trip_driver' | 'none';

type Viewer = { readonly id: number; readonly isAdmin: boolean };

// docs/05: a driver photo is public; a passenger photo is seen only by the passenger, other
// passengers of the same trip with confirmed bookings and moderators. Never by the driver.
// A photo the team did not approve yet is seen only by its owner and the team (docs/118).
export function canSeeAvatar(viewer: Viewer, owner: User, relation: TripRelation): boolean {
  if (owner.avatarKey === null) return false;
  if (viewer.id === owner.id || viewer.isAdmin) return true;
  if (!faceShown(owner)) return false;
  return owner.isDriver || relation === 'co_passenger';
}
