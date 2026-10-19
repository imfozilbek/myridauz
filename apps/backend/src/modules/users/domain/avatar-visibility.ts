import { faceShown } from './face';
import type { User } from './user';

// How the viewer is linked to the owner of the photo: passengers of one trip ride together (G08).
export type TripRelation = 'co_passenger' | 'trip_driver' | 'none';

// asDriver: the viewer is in the Mini App of a driver; isAdmin counts only in the Mini App of the team.
export type Viewer = { readonly id: number; readonly isAdmin: boolean; readonly asDriver?: boolean };

// docs/05: a driver photo is public; a passenger photo is seen only by the passenger, other
// passengers of the same trip with confirmed bookings and moderators. Never by the driver: in the
// Mini App of a driver only the own photo shows, whatever the person once was (owner, 17.10.2026).
// A driver photo the team did not approve yet and a refused photo are seen only by the owner and
// the team (docs/118, G51).
export function canSeeAvatar(viewer: Viewer, owner: User, relation: TripRelation): boolean {
  if (owner.avatarKey === null) return false;
  if (viewer.id === owner.id) return true;
  if (viewer.asDriver === true) return false;
  if (viewer.isAdmin) return true;
  if (!faceShown(owner)) return false;
  return owner.isDriver || relation === 'co_passenger';
}
