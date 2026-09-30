import type { Caller, UsersDeps } from './ports';

// What other modules keep of a person: live trips and bookings, the driver's car, chats,
// saved drivers, subscriptions, follows of shared trips. Set by the app (account-deletion.ts).
// holdPhone: an open complaint is against the person; the phone waits for its decision (docs/65 A5).
export type Forget = (userId: number) => Promise<{ readonly holdPhone: boolean }>;

// "Maʼlumotlarimni oʻchirish" (docs/30): the live trips end, personal data goes. The wallet journal,
// reviews and complaint decisions stay without a name or a phone.
export async function deleteAccount(deps: UsersDeps, forget: Forget, caller: Caller): Promise<boolean> {
  const user = await deps.users.find(caller.id);
  if (!user) return false;
  const { holdPhone } = await forget(user.id);
  if (holdPhone) await deps.users.holdPhone(user.id, user.phone, deps.now());
  if (user.avatarKey) await deps.avatars.delete(user.avatarKey);
  await deps.users.erase(user.id, deps.now());
  return true;
}
