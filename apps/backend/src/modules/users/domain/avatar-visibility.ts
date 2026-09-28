import type { User } from './user';

// How the viewer is linked to the owner of the photo. Trips arrive in G07; until then: none.
export type TripRelation = 'co_passenger' | 'trip_driver' | 'none';

type Viewer = { readonly id: number; readonly isAdmin: boolean };

// docs/05: a driver photo is public; a passenger photo is seen only by the passenger, other
// passengers of the same trip with confirmed bookings and moderators. Never by the driver.
export function canSeeAvatar(viewer: Viewer, owner: User, relation: TripRelation): boolean {
  if (owner.avatarKey === null) return false;
  if (viewer.id === owner.id || viewer.isAdmin || owner.isDriver) return true;
  return relation === 'co_passenger';
}
