import type { Caller, UsersDeps } from './ports';

// What other modules keep of a person: live trips and bookings, the driver's car, chats,
// saved drivers, subscriptions, follows of shared trips. Set by the app (account-deletion.ts).
export type Forget = (userId: number) => Promise<void>;

// "Maʼlumotlarimni oʻchirish" (docs/30): the live trips end, personal data goes. The wallet journal,
// reviews and complaint decisions stay without a name or a phone.
export async function deleteAccount(deps: UsersDeps, forget: Forget, caller: Caller): Promise<boolean> {
  const user = await deps.users.find(caller.id);
  if (!user) return false;
  await forget(user.id);
  if (user.avatarKey) await deps.avatars.delete(user.avatarKey);
  await deps.users.erase(user.id, deps.now());
  return true;
}
