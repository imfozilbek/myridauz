import { useEffect, useState } from 'react';
import { useAccount } from '../account-context';

// The photo needs the Telegram signature, so it is fetched and shown from memory (docs/05).
export function useAvatarUrl(userId: number, hasAvatar: boolean): string | null {
  const account = useAccount();
  const [url, setUrl] = useState<string | null>(null);
  const client = account?.client;
  const version = account?.avatarVersion ?? 0;
  useEffect(() => {
    if (!client || !hasAvatar) return undefined;
    let objectUrl: string | null = null;
    let active = true;
    client.getAvatar(userId).then(
      (blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      },
      () => setUrl(null),
    );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [client, userId, hasAvatar, version]);
  return hasAvatar ? url : null;
}
