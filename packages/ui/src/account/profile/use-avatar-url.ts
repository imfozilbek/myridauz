import type { PersonId } from '@platform/contracts';
import { useBlobUrl } from '../../media/use-blob-url';
import { useAccount } from '../account-context';

// The own or another person's photo, loaded with the Telegram signature (docs/05).
export function useAvatarUrl(userId: PersonId, hasAvatar: boolean): string | null {
  const account = useAccount();
  const client = account?.client;
  const load = client && hasAvatar ? () => client.getAvatar(userId) : null;
  return useBlobUrl(load, `${userId}:${hasAvatar}:${account?.avatarVersion ?? 0}`, true);
}
