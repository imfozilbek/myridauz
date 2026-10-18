import type { PersonId } from '@platform/contracts';
import { useBlobUrl } from '../../media/use-blob-url';
import { useAccount } from '../account-context';

// The own or another person's photo, loaded with the Telegram signature (docs/05). The own photo
// changed in this session comes past the copy the phone kept (owner, 17.10.2026).
export function useAvatarUrl(userId: PersonId, hasAvatar: boolean): string | null {
  const account = useAccount();
  const client = account?.client;
  const version = account?.avatarVersion ?? 0;
  const fresh = version > 0 && userId === account?.profile.id;
  const load = client && hasAvatar ? () => client.getAvatar(userId, fresh) : null;
  return useBlobUrl(load, `${userId}:${hasAvatar}:${version}`, true);
}
