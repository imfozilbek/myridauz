import { activeBlock, type Block } from '../domain/user';
import type { UsersDeps } from './ports';

// Blocked by id or by phone: every bot and Mini App shows "account blocked" (docs/17).
export async function checkAccess(deps: UsersDeps, userId: number): Promise<Block | null> {
  const user = await deps.users.find(userId);
  if (!user) return null;
  return activeBlock([user.block, await deps.users.phoneBlock(user.phone)], deps.now());
}
