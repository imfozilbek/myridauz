import { AVATAR_TYPES, MAX_AVATAR_BYTES } from '@platform/contracts';
import { canSeeAvatar } from '../domain/avatar-visibility';
import type { Caller, Failure, StoredImage, UsersDeps } from './ports';

type AvatarError = 'users.not_registered' | 'users.avatar_too_large' | 'users.invalid_input';

// The photo lives in the private R2 bucket, never behind a public link (docs/05, docs/30).
export async function setAvatar(
  deps: UsersDeps,
  caller: Caller,
  image: { readonly body: ArrayBuffer; readonly type: string },
): Promise<{ readonly ok: true } | Failure<AvatarError>> {
  const user = await deps.users.find(caller.id);
  if (!user) return { ok: false, error: 'users.not_registered' };
  if (!(AVATAR_TYPES as readonly string[]).includes(image.type) || image.body.byteLength === 0) {
    return { ok: false, error: 'users.invalid_input' };
  }
  if (image.body.byteLength > MAX_AVATAR_BYTES) return { ok: false, error: 'users.avatar_too_large' };
  // A new key for each photo: an old copy in a cache never shows the new face.
  const key = `avatars/${user.id}/${deps.newId()}`;
  await deps.avatars.put(key, image.body, image.type);
  await deps.users.save({ ...user, avatarKey: key, updatedAt: deps.now() });
  if (user.avatarKey) await deps.avatars.delete(user.avatarKey);
  return { ok: true };
}

type ReadError = 'users.not_found' | 'users.avatar_hidden';

export async function readAvatar(
  deps: UsersDeps,
  caller: Caller,
  ownerId: number,
): Promise<{ readonly ok: true; readonly image: StoredImage } | Failure<ReadError>> {
  const owner = await deps.users.find(ownerId);
  if (!owner?.avatarKey) return { ok: false, error: 'users.not_found' };
  const relation = await deps.trips.relation(caller.id, ownerId);
  // Hidden and missing look the same to others, so nobody learns that a hidden photo exists.
  if (!canSeeAvatar({ id: caller.id, isAdmin: caller.isAdmin }, owner, relation)) {
    return { ok: false, error: 'users.avatar_hidden' };
  }
  const image = await deps.avatars.get(owner.avatarKey);
  return image ? { ok: true, image } : { ok: false, error: 'users.not_found' };
}
