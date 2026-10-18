import type { PersonId } from '@platform/contracts';
import { useApiClients } from '../../context/api-clients';
import { useBlobUrl } from '../../media/use-blob-url';
import { useAccount } from '../account-context';

// The own or another person's photo, loaded with the Telegram signature (docs/05). The own photo
// changed in this session comes past the copy the phone kept (owner, 17.10.2026). Before there is an
// account, the close people see the driver's photo too (G46, docs/43).
export function useAvatarUrl(userId: PersonId, hasAvatar: boolean): string | null {
  const account = useAccount();
  const { users } = useApiClients();
  const client = account?.client ?? users;
  const version = account?.avatarVersion ?? 0;
  const fresh = version > 0 && userId === account?.profile.id;
  const load = hasAvatar ? () => client.getAvatar(userId, fresh) : null;
  return useBlobUrl(load, `${userId}:${hasAvatar}:${version}`, true);
}
