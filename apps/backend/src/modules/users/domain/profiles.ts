import type { MyProfile, PublicProfile } from '@platform/contracts';
import { rolesOf, type User } from './user';

// Ratings arrive in G11: null is shown as "Yangi" (new).
const NO_RATING = null;

export const toMyProfile = (user: User, isAdmin: boolean): MyProfile => ({
  id: user.publicId,
  firstName: user.firstName,
  gender: user.gender,
  phone: user.phone,
  roles: rolesOf(user, isAdmin),
  hasAvatar: user.avatarKey !== null,
  writeAccess: user.writeAccess,
  news: !user.newsOff,
  rating: NO_RATING,
});

// What other people see: never a phone or a username (docs/07).
export const toPublicProfile = (user: User): PublicProfile => ({
  id: user.publicId,
  firstName: user.firstName,
  hasAvatar: user.avatarKey !== null,
  rating: NO_RATING,
});
