import type { Arrival, Gender } from '@platform/contracts';
import { activeBlock, normalizePhone, type User } from '../domain/user';
import type { Caller, Failure, UsersDeps } from './ports';

type Registration = {
  readonly firstName: string;
  readonly gender: Gender;
  // From a Telegram contact whose signature was checked by the http layer.
  readonly contact: { readonly userId: number; readonly phone: string };
  // The first touch: the link, its mark and the platform (G55, docs/116).
  readonly came?: Arrival | undefined;
};
type RegisterError = 'users.already_registered' | 'users.invalid_contact' | 'users.blocked';
type RegisterResult = { readonly ok: true; readonly user: User } | Failure<RegisterError>;

// First entry: consent, name, gender, phone (docs/30, docs/10 question 33).
export async function register(
  deps: UsersDeps,
  caller: Caller,
  input: Registration,
): Promise<RegisterResult> {
  if (await deps.users.find(caller.id)) return { ok: false, error: 'users.already_registered' };
  // Only the own number, shared by Telegram, counts: nobody can register with another phone.
  if (input.contact.userId !== caller.id) return { ok: false, error: 'users.invalid_contact' };
  const phone = normalizePhone(input.contact.phone);
  const now = deps.now();
  const blocks = [await deps.users.phoneBlock(phone), await deps.users.idBlock(caller.id)];
  if (activeBlock(blocks, now)) return { ok: false, error: 'users.blocked' };
  const user: User = {
    id: caller.id,
    publicId: deps.newId().replaceAll('-', ''),
    firstName: input.firstName,
    gender: input.gender,
    phone,
    locale: 'uz-Latn',
    isDriver: false,
    consentAt: now,
    block: null,
    avatarKey: null,
    face: null,
    writeAccess: false,
    createdAt: now,
    updatedAt: now,
  };
  await deps.users.save(user);
  if (input.came) await deps.users.arrived(user.id, input.came, now);
  return { ok: true, user };
}
