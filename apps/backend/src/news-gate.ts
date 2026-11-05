import type { Bindings } from './env';
import { hiddenByComplaints } from './modules/complaints';
import { peopleOf } from './modules/users';

// A person hidden from search by complaints is in no news either: subscribers and fans hear nothing
// of them until the moderator decides (docs/17, G89 B15).
export async function inNews(env: Bindings, publicId: string): Promise<boolean> {
  const userId = await peopleOf(env).idOf(publicId);
  return userId !== undefined && !(await hiddenByComplaints(env, [userId])).has(userId);
}
