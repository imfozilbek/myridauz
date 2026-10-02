import type { UsersClient } from '@platform/api-client';
import type { MeResponse, MiniApp, MyProfile } from '@platform/contracts';
import { createContext, useContext } from 'react';

type AccountSettings = Extract<MeResponse, { state: 'active' }>['settings'];

// The person using the Mini App, after the account gate let them in.
export type Account = {
  readonly app: MiniApp;
  readonly client: UsersClient;
  readonly profile: MyProfile;
  readonly settings: AccountSettings;
  // Increases after a new photo, so screens load it again.
  readonly avatarVersion: number;
  readonly onAvatarChanged: () => void;
  // The profile loads again after a change of a setting («Bot xabarlari»).
  readonly onProfileChanged: () => void;
};

export const AccountContext = createContext<Account | null>(null);

// null in the admin Mini App: the team works there without a passenger profile.
export const useAccount = () => useContext(AccountContext);

export const UsersClientContext = createContext<UsersClient | null>(null);

export function useUsersClient(): UsersClient {
  const client = useContext(UsersClientContext);
  if (!client) throw new Error('ui.users_client_missing');
  return client;
}
