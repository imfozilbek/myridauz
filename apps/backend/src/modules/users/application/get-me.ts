import type { MeResponse } from '@platform/contracts';
import { toMyProfile } from '../domain/profiles';
import { checkAccess } from './check-access';
import type { Caller, UsersDeps } from './ports';

export async function getMe(deps: UsersDeps, caller: Caller): Promise<MeResponse> {
  const user = await deps.users.find(caller.id);
  if (!user) return { state: 'unregistered', suggestedName: caller.firstName };
  const block = await checkAccess(deps, caller.id);
  if (block) return { state: 'blocked', until: block.until };
  return { state: 'active', profile: toMyProfile(user, caller.isAdmin) };
}
